import express from "express";
import db from "../config/config.js";
import { ref, push, set, get, update } from "firebase/database";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create Student
router.post("/", auth, async (req, res) => {
  try {
    const student = {
      ...req.body,
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newStudentRef = push(ref(db, 'students'));
    await set(newStudentRef, student);
    
    res.status(201).json({ 
      message: "Siswa berhasil ditambahkan",
      student: { id: newStudentRef.key, ...student }
    });
  } catch (error) {
    console.error("Error menambahkan student:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat menambahkan siswa" });
  }
});

// Read Students
router.get("/", auth, async (req, res) => {
  try {
    const studentsRef = ref(db, 'students');
    const snapshot = await get(studentsRef);
    
    const students = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (!data.deleted) {
        students.push({
          id: childSnapshot.key,
          ...data
        });
      }
    });
    
    res.status(200).json({
      message: "Data siswa berhasil diambil",
      students
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil data siswa" });
  }
});

// Update Student
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const studentRef = ref(db, `students/${id}`);
    await update(studentRef, updateData);
    
    res.status(200).json({
      message: "Data siswa berhasil diperbarui",
      student: { id, ...updateData }
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat memperbarui data siswa" });
  }
});

// Delete Student
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const studentRef = ref(db, `students/${id}`);
    await update(studentRef, {
      deleted: true,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({ message: "Siswa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan saat menghapus siswa" });
  }
});

export default router; 