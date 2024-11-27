// Import required modules
const http = require('http');  // Import the http module
const fs = require('fs');
const path = require('path');
const url = require('url');
const multer = require('multer');
const mime = require('mime-types');

// Set up the storage and upload configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Add a timestamp to the file name
  },
});

const upload = multer({ storage: storage });

// Make sure the 'uploads' folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const port = 3000;

// Create the server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`Requested Path: ${pathname}`);  // Log the requested path

  // Serve the file upload page at the root URL
  if (pathname === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading HTML file');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });

  // Handle file upload (POST request)
  } else if (pathname === '/upload' && req.method === 'POST') {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Error uploading file');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`File uploaded successfully: ${req.file.filename}`);
    });

  // Serve the uploaded image file (GET request)
  } else if (pathname.startsWith('/uploads/') && req.method === 'GET') {
    const filePath = path.join(__dirname, pathname);
    fs.exists(filePath, (exists) => {
      if (exists) {
        const fileMime = mime.lookup(filePath) || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': fileMime });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    });

  // Handle file deletion (DELETE request)
  } else if (pathname.startsWith('/delete/') && req.method === 'DELETE') {
    const fileName = pathname.split('/delete/')[1];
    const filePath = path.join(__dirname, 'uploads', fileName);

    fs.exists(filePath, (exists) => {
      if (exists) {
        fs.unlink(filePath, (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error deleting file');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('File deleted successfully');
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    });

  } else {
    // If route is not found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
