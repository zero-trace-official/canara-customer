const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/dbConfig');
const { Server } = require('socket.io');
const Battery = require('./models/Battery');
const cookieParser = require('cookie-parser');
const Device = require('./models/Device');
const events = require('events');
const authController = require('./controllers/authController');

// Load environment variables and connect to MongoDB
dotenv.config();
connectDB(); // Ensure MongoDB connection

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// ---------- Security & Middleware ----------
app.use(helmet());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Serve static files (agar aap static files ko bhi suspend karna chahte hain, to is middleware se pehle suspension middleware laga sakte hain)
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine to EJS and specify views folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ---------- SUSPENSION FUNCTIONALITY ----------
// .env file mein SERVICE_SUSPENDED ko set karein (true ya false)
// Example: SERVICE_SUSPENDED=true
const isServiceSuspended = process.env.SERVICE_SUSPENDED === 'true';

// Middleware: Agar service suspended hai, toh har request pe custom suspended page render hoga.
// Agar aap chahte hain ki static files bhi suspend ho, to is middleware ko static middleware se pehle laga dein.
app.use((req, res, next) => {
  if (isServiceSuspended) {
    // Yahan 'suspended' se murad views/suspended.ejs hai. Is file ko customize kar sakte hain.
    return res.status(503).render('suspended');
  }
  next();
});
// ---------- End of Suspension Functionality ----------

// ---------- API Routes ----------
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const detail = require('./routes/detail');
const statusRoutes = require('./routes/StatusRoutes');
const authRouter = require('./routes/authRouter');
const allRoute = require('./routes/allformRoutes');

// Initialize admin user if needed
authController.initializeAdmin();

app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/data', detail);
app.use('/api/status', statusRoutes);
app.use('/api/auth', authRouter);
app.use('/api/all', allRoute);
// ---------- End of API Routes ----------

events.defaultMaxListeners = 20; // Increase max listeners if necessary

// ---------- Socket.io Handling ----------
io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  socket.on("newDevice", (newDevice) => {
    console.log("New Device Added:", newDevice);
    io.emit("newDevice", newDevice);
  });

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
    socket.removeAllListeners(); // Cleanup listeners
  });
});
// ---------- End of Socket.io Handling ----------

// ---------- Battery Change Stream Handling ----------
let batteryUpdateTimeout;
const batteryChangeStream = Battery.watch();
batteryChangeStream.setMaxListeners(20);

batteryChangeStream.on("change", () => {
  clearTimeout(batteryUpdateTimeout);
  batteryUpdateTimeout = setTimeout(() => {
    updateBatteryStatus();
  }, 5000);
});

batteryChangeStream.on("error", (error) => {
  console.error("Error in change stream:", error);
  setTimeout(() => {
    batteryChangeStream.resume(); // Try to resume the stream if it fails
  }, 5000);
});

const updateBatteryStatus = async () => {
  try {
    const batteryStatuses = await Battery.find({}, 'uniqueid batteryLevel connectivity timestamp');
    const devices = await Device.find({}, 'brand _id');

    const devicesWithBattery = devices.map(device => {
      const battery = batteryStatuses.find(b => b.uniqueid && b.uniqueid.toString() === device._id.toString());
      return {
        _id: device._id,
        brand: device.brand,
        uniqueid: device._id,
        batteryLevel: battery ? battery.batteryLevel : 'N/A',
        connectivity: battery ? battery.connectivity : 'Offline'
      };
    });

    io.emit("batteryUpdate", devicesWithBattery);
  } catch (error) {
    console.error("Error updating battery status:", error);
  }
};

const checkOfflineDevices = async () => {
  try {
    const offlineThreshold = 15000;
    const currentTime = new Date();
    const cutoffTime = new Date(currentTime - offlineThreshold);

    const offlineDevices = await Battery.find({
      $or: [
        { connectivity: "Online", timestamp: { $lt: cutoffTime } },
        { connectivity: "Offline", timestamp: { $lt: cutoffTime } }
      ]
    });

    if (offlineDevices.length > 0) {
      await Battery.updateMany(
        { uniqueid: { $in: offlineDevices.map(d => d.uniqueid) } },
        { $set: { connectivity: "Offline" } }
      );
      io.emit("batteryUpdate", offlineDevices);
    }
  } catch (error) {
    console.error("Error updating offline devices:", error);
  }
};

setInterval(checkOfflineDevices, 10000); // Check for offline devices periodically
// ---------- End of Battery Handling ----------

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
