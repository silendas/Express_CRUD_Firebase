import express from "express";
import db from "../config/config.js";
import { ref, push, set, get, update, query, orderByChild, equalTo } from "firebase/database";
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
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let emailExists = false;
    
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.email === email && !userData.deleted) {
        emailExists = true;
      }
    });
    
    if (emailExists) {
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
    
    const newUserRef = push(ref(db, 'users'));
    await set(newUserRef, user);
    
    // Hapus password dari response
    const userResponse = {
      id: newUserRef.key,
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
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    const users = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (!userData.deleted) {
        // Hapus data sensitif
        const { password, ...userWithoutPassword } = userData;
        users.push({
          id: childSnapshot.key,
          ...userWithoutPassword
        });
      }
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
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      let emailExists = false;
      
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === email && !userData.deleted && childSnapshot.key !== id) {
          emailExists = true;
        }
      });
      
      if (emailExists) {
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

    const userRef = ref(db, `users/${id}`);
    await update(userRef, hashedData);
    
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
    const userRef = ref(db, `users/${id}`);
    
    await update(userRef, { 
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
