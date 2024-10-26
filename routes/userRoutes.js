import express from "express";
import db from "../config/config.js"; // Pastikan ini mengimpor db yang benar
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"; // Impor fungsi yang diperlukan

const router = express.Router();

// Create User
router.post("/", async (req, res) => {
  try {
    const user = req.body;
    const docRef = await addDoc(collection(db, "users"), user); // Gunakan addDoc dan collection
    res.status(201).send({ id: docRef.id, ...user });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(400).send(error);
  }
});

// Read Users
router.get("/", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "users")); // Menggunakan getDocs untuk mengambil data
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update User
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRef = doc(db, "users", id); // Mendapatkan referensi dokumen
    await updateDoc(userRef, req.body); // Menggunakan updateDoc untuk memperbarui data
    res.status(200).send({ id, ...req.body });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete User
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userRef = doc(db, "users", id); // Mendapatkan referensi dokumen
    await deleteDoc(userRef); // Menggunakan deleteDoc untuk menghapus data
    res.status(204).send();
  } catch (error) {
    res.status(400).send(error);
  }
});

export default router; // Ekspor router
