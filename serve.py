import os
import re
import sys
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class RangeRequestHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with basic HTTP Range support, so <video preload="metadata">
    and byte-range seeking work locally the way a real static host (GitHub Pages, Netlify, etc.)
    would serve them, instead of forcing a full-file download for every request."""

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()

        range_header = self.headers.get("Range")
        if not range_header:
            return super().send_head()

        file_size = os.path.getsize(path)
        match = re.match(r"bytes=(\d*)-(\d*)", range_header)
        if not match:
            return super().send_head()

        start_str, end_str = match.groups()
        if start_str == "" and end_str == "":
            return super().send_head()

        if start_str == "":
            length = int(end_str)
            start = max(file_size - length, 0)
            end = file_size - 1
        else:
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1
        end = min(end, file_size - 1)

        if start > end or start >= file_size:
            self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        ctype = self.guess_type(path)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(int(os.path.getmtime(path))))
        self.end_headers()
        self._range = (start, end)
        return f

    def copyfile(self, source, outputfile):
        if hasattr(self, "_range"):
            start, end = self._range
            remaining = end - start + 1
            chunk = 64 * 1024
            try:
                while remaining > 0:
                    data = source.read(min(chunk, remaining))
                    if not data:
                        break
                    outputfile.write(data)
                    remaining -= len(data)
            finally:
                source.close()
            return
        super().copyfile(source, outputfile)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
server = ThreadingHTTPServer(("0.0.0.0", port), RangeRequestHandler)
print(f"Serving on 0.0.0.0:{port} (threaded, Range-aware)")
server.serve_forever()
