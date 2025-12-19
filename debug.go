package main

import (
	"log"
	"net/http"
)

type logResponseWriter struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
}

func (w *logResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *logResponseWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.bytesWritten += n
	log.Printf("DEBUG: Write called with %d bytes: %s", n, string(b))
	return n, err
}

func (w *logResponseWriter) Flush() {
	if f, ok := w.ResponseWriter.(http.Flusher); ok {
		f.Flush()
		log.Println("DEBUG: Flush called")
	}
}
