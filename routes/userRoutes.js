import express from "express";
import db from "../config/config.js";
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create User (Protected)
router.post("/", auth, async (req, res) => {
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

    // Hash password
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
    
    // Hapus password dari response
    const userResponse = {
      id: docRef.id,
      email,
      ...otherData,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({ 
      message: "User berhasil ditambahkan",
      user: userResponse 
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat menambahkan user" });
  }
});

// Read Users (Protected)
router.get("/", auth, async (req, res) => {
  try {
    const q = query(collection(db, "users"), where("deleted", "==", false));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => {
      const userData = doc.data();
      // Hapus data sensitif
      delete userData.password;
      return { 
        id: doc.id, 
        ...userData
      };
    });
    res.status(200).json({
      message: "Data user berhasil diambil",
      users
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user" });
  }
});

// Update User (Protected)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, ...updateData } = req.body;
    
    // Jika ada update email, cek duplikasi
    if (email) {
      const q = query(
        collection(db, "users"), 
        where("email", "==", email),
        where("deleted", "==", false)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty && snapshot.docs[0].id !== id) {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    }

    let hashedData = { 
      ...updateData,
      email,
      updatedAt: new Date().toISOString()
    };

    // Hash password baru jika ada
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      hashedData.password = hashedPassword;
    }

    const userRef = doc(db, "users", id);
    await updateDoc(userRef, hashedData);
    
    // Hapus password dari response
    delete hashedData.password;
    
    res.status(200).json({
      message: "User berhasil diperbarui",
      user: { id, ...hashedData }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat memperbarui user" });
  }
});

// Delete User (Protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userRef = doc(db, "users", id);
    
    await updateDoc(userRef, { 
      deleted: true,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat menghapus user" });
  }
});

export default router;
