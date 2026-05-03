ARG PYTHON_VERSION=3.11-slim
FROM python:${PYTHON_VERSION}

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

# 🔥 dependências do sistema (WeasyPrint)
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# dependências Python
COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

# código
COPY . /code

EXPOSE 8000

# 🚀 produção (Fly recomendado)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]