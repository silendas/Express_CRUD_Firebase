import express from "express";
import db from "../config/config.js";
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, ...otherData } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password harus diisi" });
    }
    
    // Cek email yang sudah ada
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Tambahkan log untuk memeriksa proses hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      ...otherData,
      email,
      password: hashedPassword,
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "users"), user);
    
    const token = jwt.sign({ id: docRef.id }, JWT_SECRET, { expiresIn: "1d" });
    
    // Hapus password dari response
    const userResponse = {
      id: docRef.id,
      email,
      ...otherData,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({ 
      message: "Registrasi berhasil",
      token,
      user: userResponse
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat registrasi" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password harus diisi" });
    }

    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    console.log("Query result empty?", snapshot.empty);
    
    if (snapshot.empty) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const userData = snapshot.docs[0];
    const user = { id: userData.id, ...userData.data() };

    console.log("Found user:", { 
      id: user.id, 
      email: user.email,
      deleted: user.deleted 
    });

    if (user.deleted) {
      return res.status(401).json({ message: "Akun tidak ditemukan" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("Password valid?", isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });

    // Hapus data sensitif dari response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({ 
      message: "Login berhasil",
      token, 
      user: userResponse 
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat login" });
  }
});

// Get Current User
router.get("/me", auth, async (req, res) => {
  try {
    // req.user sudah diset di middleware auth
    res.status(200).json({ 
      message: "Data user berhasil diambil",
      user: req.user 
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user" });
  }
});

// Logout
router.post("/logout", auth, (req, res) => {
  try {
    // Tidak perlu melakukan apa-apa di server karena token disimpan di client
    res.status(200).json({ message: "Logout berhasil" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat logout" });
  }
});

// Change Password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Password lama dan password baru harus diisi" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password baru harus minimal 6 karakter" 
      });
    }

    const userRef = doc(db, "users", req.user.id);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Password lama tidak valid" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await updateDoc(userRef, { password: hashedPassword });

    res.status(200).json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengubah password" });
  }
});

export default router; 