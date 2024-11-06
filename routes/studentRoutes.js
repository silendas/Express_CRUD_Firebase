import express from "express";
import db from "../config/config.js";
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create Student (Protected)
router.post("/", auth, async (req, res) => {
  try {
    const student = {
      ...req.body,
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "students"), student);
    res.status(201).json({ 
      message: "Siswa berhasil ditambahkan",
      student: { id: docRef.id, ...student }
    });
  } catch (error) {
    console.error("Error menambahkan student:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat menambahkan siswa" });
  }
});

// Read Students (Protected)
router.get("/", auth, async (req, res) => {
  try {
    const q = query(collection(db, "students"), where("deleted", "==", false));
    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({
      message: "Data siswa berhasil diambil",
      students
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil data siswa" });
  }
});

// Update Student (Protected)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    const studentRef = doc(db, "students", id);
    await updateDoc(studentRef, updateData);
    res.status(200).json({
      message: "Data siswa berhasil diperbarui",
      student: { id, ...updateData }
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat memperbarui data siswa" });
  }
});

// Delete Student (Protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const studentRef = doc(db, "students", id);
    await updateDoc(studentRef, { 
      deleted: true,
      updatedAt: new Date().toISOString()
    });
    res.status(200).json({ message: "Siswa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat menghapus siswa" });
  }
});

export default router; 