import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.token = localStorage.getItem('asta360_token');
  }

  connect() {
    if (this.token) {
      this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: this.token
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to ASTA360 server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from ASTA360 server');
      });

      this.socket.on('notification', (data) => {
        this.showNotification(data);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  joinRoom(roomName) {
    if (this.socket) {
      this.socket.emit('join-room', roomName);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  showNotification(data) {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  }

  initialize() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    this.connect();
  }
}

const socketService = new SocketService();
export default socketService;
