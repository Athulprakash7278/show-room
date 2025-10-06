import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    date: "",
    reason: "",
  });

  const [sortBy, setSortBy] = useState("date");

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      const querySnapshot = await getDocs(collection(db, "attendance"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAttendance(data);
    };
    fetchAttendance();
  }, []);

  // Delete record
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "attendance", id));
    setAttendance(attendance.filter((a) => a.id !== id));
  };

  // Open Add form
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ username: "", date: "", reason: "" });
    setOpen(true);
  };

  // Open Edit form
  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormData({
      username: item.username,
      date: item.date?.toDate
        ? item.date.toDate().toISOString().split("T")[0]
        : item.date,
      reason: item.reason,
    });
    setOpen(true);
  };

  // Save record
  const handleSave = async () => {
    if (!formData.username || !formData.date || !formData.reason) {
      alert("All fields required!");
      return;
    }

    if (isEditing) {
      const ref = doc(db, "attendance", editId);
      await updateDoc(ref, {
        ...formData,
        date: new Date(formData.date),
      });
      setAttendance(
        attendance.map((a) =>
          a.id === editId ? { id: editId, ...formData } : a
        )
      );
    } else {
      const docRef = await addDoc(collection(db, "attendance"), {
        ...formData,
        date: new Date(formData.date),
      });
      setAttendance([...attendance, { id: docRef.id, ...formData }]);
    }

    setOpen(false);
    setFormData({ username: "", date: "", reason: "" });
  };

  // Sorting
  const sortedAttendance = [...attendance].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.date.seconds ? a.date.toDate() : a.date) -
             new Date(b.date.seconds ? b.date.toDate() : b.date);
    }
    return a.username.localeCompare(b.username);
  });

  return (
    <Box sx={{ p: 3, backgroundColor: "#eef9f9", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
      >
        <Typography variant="h4">Attendance Management</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="username">Username</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleOpenAdd}>
            Add Attendance
          </Button>
        </Box>
      </Box>

      {/* Attendance List */}
      {sortedAttendance.map((item) => (
        <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ cursor: "pointer" }}
              onClick={() =>
                setExpandedItem(expandedItem === item.id ? null : item.id)
              }
            >
              {item.username}
            </Typography>
            <Box>
              <IconButton onClick={() => handleOpenEdit(item)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(item.id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton
                onClick={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          </Box>
          <Collapse in={expandedItem === item.id}>
            <Box sx={{ mt: 2 }}>
              <Typography>Date: {item.date?.seconds ? item.date.toDate().toLocaleDateString() : item.date}</Typography>
              <Typography>Reason: {item.reason}</Typography>
            </Box>
          </Collapse>
        </Paper>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isEditing ? "Edit Attendance" : "Add Attendance"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Reason"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
