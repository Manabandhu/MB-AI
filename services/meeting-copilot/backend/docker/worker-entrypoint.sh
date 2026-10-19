#!/bin/sh
# faster-whisper (CTranslate2) needs cuBLAS and cuDNN. With CUDA builds of torch they are
# already installed as pip packages; point the loader at them. Harmless on CPU images.
LIBS=$(python - <<'PY'
import importlib
paths = []
for name in ("nvidia.cublas.lib", "nvidia.cudnn.lib"):
    try:
        paths.extend(importlib.import_module(name).__path__)
    except Exception:
        pass
print(":".join(paths))
PY
)
if [ -n "$LIBS" ]; then
    export LD_LIBRARY_PATH="$LIBS${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi
exec "$@"
