"""Tkinter window for the Windows recorder. Kept thin: all real work lives in session.py."""

from __future__ import annotations

import queue
import threading
import tkinter as tk
import webbrowser
from datetime import datetime
from tkinter import messagebox, ttk

from .capture import Capture, CaptureError
from .client import ApiClient, ApiError
from .session import RecordingInfo, RecordingSession, now_iso, pending_recordings, recover_interrupted, upload_recording
from .settings import Settings, load_token, recordings_dir, save_token

INK = "#1d2430"
MUTED = "#5b6676"
PAGE = "#eef1f4"
SURFACE = "#f8fafb"
YOU = "#0f6e6a"
MEETING = "#4c5bd4"
REC = "#c8372d"

PROFILES = [("standup", "Standup"), ("general", "General meeting")]


def default_title(profile: str) -> str:
    return f"{'Standup' if profile == 'standup' else 'Meeting'}, {datetime.now():%a %b %d}"


class RecorderApp:
    def __init__(self, root: tk.Tk, capture_cls: type[Capture]):
        self.root = root
        self.capture_cls = capture_cls
        self.settings = Settings.load()
        self.session: RecordingSession | None = None
        self.events: queue.Queue = queue.Queue()  # (kind, payload) from worker threads
        self.uploading = False

        root.title("Meeting Copilot Recorder")
        root.configure(bg=PAGE)
        root.minsize(440, 520)
        root.protocol("WM_DELETE_WINDOW", self.on_close)
        self._style()
        self._build()
        self.root.after(100, self._poll)
        self.root.after(300, self._startup_checks)

    # ---------- layout ----------

    def _style(self):
        s = ttk.Style(self.root)
        try:
            s.theme_use("clam")
        except tk.TclError:
            pass
        base = ("Segoe UI", 10)
        s.configure(".", background=PAGE, foreground=INK, font=base)
        s.configure("TLabel", background=PAGE, foreground=INK)
        s.configure("Muted.TLabel", foreground=MUTED)
        s.configure("Title.TLabel", font=("Segoe UI Semibold", 15))
        s.configure("Clock.TLabel", font=("Segoe UI Semibold", 30))
        s.configure("TCheckbutton", background=PAGE)
        s.configure("TRadiobutton", background=PAGE)
        s.configure("TEntry", fieldbackground=SURFACE)
        s.configure("Primary.TButton", background=INK, foreground=PAGE, padding=(14, 8), borderwidth=0)
        s.map(
            "Primary.TButton",
            background=[("disabled", "#9aa4b2"), ("active", "#2d3746")],
            foreground=[("disabled", PAGE)],
        )
        s.map("TCombobox", fieldbackground=[("readonly", SURFACE)])
        s.configure("TButton", padding=(10, 6))
        s.configure("You.Horizontal.TProgressbar", background=YOU, troughcolor="#d5dbe3", borderwidth=0)
        s.configure("Meeting.Horizontal.TProgressbar", background=MEETING, troughcolor="#d5dbe3", borderwidth=0)

    def _build(self):
        pad = {"padx": 18}
        f = ttk.Frame(self.root, padding=(0, 16, 0, 16))
        f.pack(fill="both", expand=True)

        head = ttk.Frame(f)
        head.pack(fill="x", **pad)
        ttk.Label(head, text="Meeting Copilot", style="Title.TLabel").pack(side="left")
        ttk.Button(head, text="Settings", command=self.open_settings).pack(side="right")

        self.form = ttk.Frame(f)
        self.form.pack(fill="x", pady=(14, 0), **pad)

        ttk.Label(self.form, text="What are you recording?").pack(anchor="w")
        self.mode = tk.StringVar(value="call")
        ttk.Radiobutton(
            self.form, text="A call on this computer (Teams, Zoom, Meet)", variable=self.mode, value="call"
        ).pack(anchor="w", pady=(4, 0))
        ttk.Radiobutton(self.form, text="People in the room (microphone only)", variable=self.mode, value="room").pack(
            anchor="w"
        )

        row = ttk.Frame(self.form)
        row.pack(fill="x", pady=(12, 0))
        ttk.Label(row, text="Type").grid(row=0, column=0, sticky="w")
        ttk.Label(row, text="Title").grid(row=0, column=1, sticky="w", padx=(10, 0))
        self.profile = tk.StringVar(value=dict(PROFILES).get(self.settings.profile, "Standup"))
        combo = ttk.Combobox(
            row, textvariable=self.profile, values=[p[1] for p in PROFILES], state="readonly", width=16
        )
        combo.grid(row=1, column=0, sticky="w")
        combo.bind("<<ComboboxSelected>>", lambda e: self.title_var.set(default_title(self._profile_key())))
        self.title_var = tk.StringVar(value=default_title(self.settings.profile))
        ttk.Entry(row, textvariable=self.title_var).grid(row=1, column=1, sticky="ew", padx=(10, 0))
        row.columnconfigure(1, weight=1)

        ttk.Label(self.form, text="Who's attending (optional, comma separated)").pack(anchor="w", pady=(12, 0))
        self.attendees = tk.StringVar(value=", ".join(self.settings.default_attendees))
        ttk.Entry(self.form, textvariable=self.attendees).pack(fill="x")

        self.consent = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            self.form, text="I've told everyone in this meeting that I'm recording it", variable=self.consent,
            command=self._refresh_buttons,
        ).pack(anchor="w", pady=(14, 0))  # fmt: skip

        live = ttk.Frame(f)
        live.pack(fill="x", pady=(18, 0), **pad)
        self.clock = ttk.Label(live, text="0:00", style="Clock.TLabel")
        self.clock.pack(anchor="w")
        self.you_bar = self._meter(live, "You", "You.Horizontal.TProgressbar")
        self.meeting_bar = self._meter(live, "Meeting audio", "Meeting.Horizontal.TProgressbar")

        actions = ttk.Frame(f)
        actions.pack(fill="x", pady=(16, 0), **pad)
        self.record_btn = ttk.Button(actions, text="Start recording", style="Primary.TButton", command=self.toggle)
        self.record_btn.pack(side="left")
        self.open_btn = ttk.Button(actions, text="Open in browser", command=self.open_last)
        self.last_url: str | None = None

        self.status = ttk.Label(f, text="", style="Muted.TLabel", wraplength=400, justify="left")
        self.status.pack(fill="x", pady=(14, 0), **pad)
        self.pending_btn = ttk.Button(f, text="Upload saved recordings", command=self.upload_pending)
        self._refresh_buttons()

    def _meter(self, parent, label, style):
        row = ttk.Frame(parent)
        row.pack(fill="x", pady=(6, 0))
        ttk.Label(row, text=label, width=14).pack(side="left")
        bar = ttk.Progressbar(row, style=style, maximum=1.0, mode="determinate")
        bar.pack(side="left", fill="x", expand=True)
        return bar

    # ---------- helpers ----------

    def _profile_key(self) -> str:
        label = self.profile.get()
        return next((k for k, v in PROFILES if v == label), "standup")

    def _client(self) -> ApiClient:
        token = load_token(self.settings.server_url)
        if not token:
            raise ApiError("Add your server address and access token in Settings first.")
        return ApiClient(self.settings.server_url, token, self.settings.verify_tls)

    def _set_status(self, text: str):
        self.status.configure(text=text)

    def _refresh_buttons(self):
        recording = self.session is not None
        if recording:
            self.record_btn.configure(text="Stop and upload", state="normal")
        else:
            ok = self.consent.get() and not self.uploading
            self.record_btn.configure(text="Start recording", state="normal" if ok else "disabled")
        pending = pending_recordings(recordings_dir())
        if pending and not recording and not self.uploading:
            self.pending_btn.configure(text=f"Upload {len(pending)} saved recording{'s' if len(pending) > 1 else ''}")
            self.pending_btn.pack(anchor="w", padx=18, pady=(8, 0))
        else:
            self.pending_btn.pack_forget()

    # ---------- actions ----------

    def _startup_checks(self):
        recovered = recover_interrupted(recordings_dir())
        if recovered:
            self._set_status(
                f"Recovered {len(recovered)} recording(s) from a previous session that ended unexpectedly."
            )
        if not load_token(self.settings.server_url):
            self._set_status("Welcome. Open Settings to add your server address and access token.")
        self._refresh_buttons()

    def toggle(self):
        if self.session is None:
            self.start()
        else:
            self.stop()

    def start(self):
        stereo = self.mode.get() == "call"
        info = RecordingInfo(
            title=self.title_var.get().strip() or default_title(self._profile_key()),
            profile=self._profile_key(),
            attendees=[a.strip() for a in self.attendees.get().split(",") if a.strip()],
            consent=self.consent.get(),
            stereo=stereo,
            started_at=now_iso(),
        )
        try:
            session = RecordingSession(recordings_dir(), self.capture_cls, info)
            session.start()
        except CaptureError as e:
            messagebox.showerror("Can't start recording", str(e))
            return
        self.session = session
        self.settings.profile = info.profile
        self.settings.save()
        names = session.capture.device_names
        detail = f"Mic: {names.get('mic', '?')}"
        if stereo:
            detail += f"\nMeeting audio from: {names.get('meeting', '?')}"
        self._set_status(f"Recording.\n{detail}")
        self.open_btn.pack_forget()
        for child in self.form.winfo_children():
            self._set_enabled(child, False)
        self._refresh_buttons()

    def _set_enabled(self, widget, enabled: bool):
        """Lock the form inputs while recording (labels stay as they are)."""
        if isinstance(widget, (ttk.Entry, ttk.Radiobutton, ttk.Checkbutton)):  # Combobox is an Entry
            state = (
                "readonly" if (enabled and isinstance(widget, ttk.Combobox)) else ("normal" if enabled else "disabled")
            )
            widget.configure(state=state)
        for child in widget.winfo_children():
            self._set_enabled(child, enabled)

    def stop(self):
        session = self.session
        if session is None:
            return
        self.session = None
        self.uploading = True
        self._set_status("Finishing the recording…")
        self._refresh_buttons()
        self.record_btn.configure(state="disabled")

        def work():
            try:
                session.stop()
                self.events.put(("status", "Uploading…"))
                meeting_id = upload_recording(
                    session.folder, self._client(), lambda f: self.events.put(("progress", f))
                )
                self.events.put(("uploaded", meeting_id))
            except Exception as e:
                self.events.put(("upload_failed", str(e)))

        threading.Thread(target=work, daemon=True).start()

    def upload_pending(self):
        folders = pending_recordings(recordings_dir())
        if not folders:
            return
        self.uploading = True
        self._refresh_buttons()

        def work():
            done, last = 0, None
            for folder in folders:
                try:
                    last = upload_recording(folder, self._client(), lambda f: self.events.put(("progress", f)))
                    done += 1
                except Exception as e:
                    self.events.put(("upload_failed", str(e)))
                    return
            self.events.put(("uploaded", last))

        threading.Thread(target=work, daemon=True).start()

    def open_last(self):
        if self.last_url:
            webbrowser.open(self.last_url)

    def open_settings(self):
        SettingsDialog(self.root, self.settings, on_saved=self._refresh_buttons)

    def on_close(self):
        if self.session is not None:
            if not messagebox.askyesno(
                "Stop recording?", "A recording is in progress. Stop it and keep it for later upload?"
            ):
                return
            try:
                self.session.stop()
            except Exception:
                pass  # the raw files are recovered on next launch
        self.root.destroy()

    # ---------- UI loop ----------

    def _poll(self):
        if self.session is not None:
            cap = self.session.capture
            try:
                cap.check()
            except CaptureError as e:
                self._set_status(str(e))
                self.stop()
            mic, meeting = cap.levels()
            self.you_bar["value"] = mic
            self.meeting_bar["value"] = meeting
            s = int(cap.seconds)
            self.clock.configure(
                text=f"{s // 3600}:{s // 60 % 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"
            )
        else:
            self.you_bar["value"] = 0
            self.meeting_bar["value"] = 0

        while True:
            try:
                kind, payload = self.events.get_nowait()
            except queue.Empty:
                break
            if kind == "status":
                self._set_status(payload)
            elif kind == "progress":
                self._set_status(f"Uploading {int(payload * 100)}%")
            elif kind == "uploaded":
                self.uploading = False
                try:
                    self.last_url = self._client().meeting_url(payload)
                except ApiError:
                    self.last_url = None
                self._set_status("Uploaded. The summary will be ready in a few minutes.")
                if self.last_url:
                    self.open_btn.pack(side="left", padx=(10, 0))
                self._after_recording()
            elif kind == "upload_failed":
                self.uploading = False
                self._set_status(
                    f"Not uploaded: {payload}\n"
                    "The recording is saved on this computer. Upload it from here when the server is reachable."
                )
                self._after_recording()
        self.root.after(100, self._poll)

    def _after_recording(self):
        for child in self.form.winfo_children():
            self._set_enabled(child, True)
        self.consent.set(False)
        self.title_var.set(default_title(self._profile_key()))
        self.clock.configure(text="0:00")
        self._refresh_buttons()


class SettingsDialog(tk.Toplevel):
    def __init__(self, parent, settings: Settings, on_saved):
        super().__init__(parent)
        self.title("Settings")
        self.configure(bg=PAGE)
        self.resizable(False, False)
        self.settings = settings
        self.on_saved = on_saved
        f = ttk.Frame(self, padding=18)
        f.pack(fill="both")
        ttk.Label(f, text="Server address").pack(anchor="w")
        self.url = tk.StringVar(value=settings.server_url)
        ttk.Entry(f, textvariable=self.url, width=44).pack(fill="x")
        ttk.Label(f, text="Access token (API_TOKEN on the server)").pack(anchor="w", pady=(10, 0))
        self.token = tk.StringVar(value=load_token(settings.server_url))
        ttk.Entry(f, textvariable=self.token, show="•", width=44).pack(fill="x")
        self.verify = tk.BooleanVar(value=settings.verify_tls)
        ttk.Checkbutton(f, text="Verify the server's HTTPS certificate", variable=self.verify).pack(
            anchor="w", pady=(10, 0)
        )
        self.msg = ttk.Label(f, text="", style="Muted.TLabel", wraplength=340)
        self.msg.pack(anchor="w", pady=(10, 0))
        buttons = ttk.Frame(f)
        buttons.pack(fill="x", pady=(12, 0))
        ttk.Button(buttons, text="Save", style="Primary.TButton", command=self.save).pack(side="right")
        ttk.Button(buttons, text="Test connection", command=self.test).pack(side="right", padx=(0, 8))
        self.transient(parent)
        self.grab_set()

    def test(self):
        try:
            ApiClient(self.url.get().strip(), self.token.get().strip(), self.verify.get()).check()
            self.msg.configure(text="Connected.")
        except ApiError as e:
            self.msg.configure(text=str(e))

    def save(self):
        self.settings.server_url = self.url.get().strip().rstrip("/")
        self.settings.verify_tls = self.verify.get()
        self.settings.save()
        save_token(self.settings.server_url, self.token.get().strip())
        self.on_saved()
        self.destroy()


def run(capture_cls: type[Capture]) -> None:
    root = tk.Tk()
    try:  # crisp text on high-DPI Windows displays
        import ctypes

        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        pass
    RecorderApp(root, capture_cls)
    root.mainloop()
