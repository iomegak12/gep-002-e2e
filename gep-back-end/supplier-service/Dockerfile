FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# All OTel instrumentation packages are explicitly pinned in requirements.txt,
# so `opentelemetry-bootstrap` is intentionally NOT run here — it would attempt
# to re-resolve versions and can break our coordinated 0.62b1 / 1.41.1 set.
COPY app ./app
EXPOSE 3002
CMD ["opentelemetry-instrument", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
