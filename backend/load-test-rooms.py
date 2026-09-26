import concurrent.futures
import time
import requests

BASE_URL = "http://localhost:8080/api/v1/rooms/listings"
CONCURRENT_USERS = 150
TOTAL_REQUESTS = 500

endpoints = [
    f"{BASE_URL}?city=Coppell&dietaryPreference=PURE_VEG",
    f"{BASE_URL}?city=Richardson&maxPrice=500",
    f"{BASE_URL}?city=Sunnyvale&privateBathOnly=true",
    f"{BASE_URL}?lat=32.9546&lng=-96.9903&radiusMiles=15",
]

def make_request(url):
    start = time.time()
    try:
        res = requests.get(url, timeout=10)
        duration = (time.time() - start) * 1000
        return res.status_code, duration
    except Exception as e:
        return 500, 0

# Pre-warm endpoints before launching concurrent barrage
print("Warming up endpoints...")
for ep in endpoints:
    try:
        requests.get(ep, timeout=10)
    except Exception as e:
        print(f"Warm-up warning for {ep}: {e}")

print(f"Starting Load Test with {CONCURRENT_USERS} concurrent simulated users...")
start_time = time.time()

with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
    urls = [endpoints[i % len(endpoints)] for i in range(TOTAL_REQUESTS)]
    results = list(executor.map(make_request, urls))

total_time = time.time() - start_time
durations = [r[1] for r in results if r[0] == 200]
success_count = sum(1 for r in results if r[0] == 200)

print("--- LOAD TEST RESULTS ---")
print(f"Total Requests: {TOTAL_REQUESTS}")
print(f"Success Rate: {(success_count / TOTAL_REQUESTS) * 100:.1f}%")
print(f"Total Elapsed Time: {total_time:.2f}s")
print(f"Throughput: {TOTAL_REQUESTS / total_time:.1f} req/sec")
print(f"Average Latency: {sum(durations) / len(durations):.1f}ms")
print(f"p95 Latency: {sorted(durations)[int(len(durations) * 0.95)]:.1f}ms")
assert (success_count / TOTAL_REQUESTS) >= 0.98, "Load test failed: Success rate below 98%"
assert (sum(durations) / len(durations)) <= 150, "Load test failed: Avg latency over 150ms"
print("LOAD TEST PASSED SUCCESSFULLY!")
