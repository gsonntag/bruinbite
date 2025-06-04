# Start from a Python base with Go installed
FROM python:3.12-slim

# Install Go
RUN apt-get update && apt-get install -y golang

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

EXPOSE 8080
CMD ["./server"]