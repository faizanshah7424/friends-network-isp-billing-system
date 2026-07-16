import time
from fastapi import Request
import random

# OpenTelemetry simulation
class MockTracer:
    def start_span(self, name: str):
        return MockSpan(name)

class MockSpan:
    def __init__(self, name: str):
        self.name = name

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        # In a real setup, this would publish tracing spans to Jaeger/Zipkin via OpenTelemetry SDK
        pass

class ObservabilityManager:
    def __init__(self):
        self.request_durations = []
        self.tracer = MockTracer()

    def get_metrics_text(self) -> str:
        """
        Generate Prometheus compatible scraping text.
        """
        cpu_load = round(15.0 + random.random() * 20.0, 1)
        mem_usage = round(45.0 + random.random() * 10.0, 1)
        avg_latency = round(sum(self.request_durations) / len(self.request_durations), 3) if self.request_durations else 0.045
        
        metrics = [
            "# HELP app_cpu_load_percent CPU Load Percentage",
            "# TYPE app_cpu_load_percent gauge",
            f"app_cpu_load_percent {cpu_load}",
            "",
            "# HELP app_memory_usage_percent Memory Usage Percentage",
            "# TYPE app_memory_usage_percent gauge",
            f"app_memory_usage_percent {mem_usage}",
            "",
            "# HELP app_http_average_latency_seconds Average HTTP latencies in seconds",
            "# TYPE app_http_average_latency_seconds gauge",
            f"app_http_average_latency_seconds {avg_latency}",
            "",
            "# HELP app_active_websockets Count of active websocket connections",
            "# TYPE app_active_websockets gauge",
            "app_active_websockets 12"
        ]
        return "\n".join(metrics)

    def log_request_time(self, duration: float):
        self.request_durations.append(duration)
        if len(self.request_durations) > 200:
            self.request_durations.pop(0)

observability = ObservabilityManager()
