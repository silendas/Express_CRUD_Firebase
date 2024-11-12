'use strict';

import jwt from "jsonwebtoken";
import { ref, get } from "firebase/database";
import db from "../config/config.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Akses ditolak" });
    }

    const token = authHeader.split(" ")[1];
    if (!token?.trim()) {
      return res.status(401).json({ message: "Token tidak valid" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Cek user di Firebase Realtime Database
    const userRef = ref(db, `users/${decoded.id}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists() || snapshot.val().deleted) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const userData = snapshot.val();
    delete userData.password; // Hapus password dari data user

    req.user = { id: decoded.id, ...userData };
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token telah kadaluarsa" });
    }
    
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

export default auth;
