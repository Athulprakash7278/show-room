import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
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
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";

export default function StaffManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    salary: "",
    joining_date: "",
    active: true,
    username: "",
    password: "", // ✅ added password
  });

  // Sorting state
  const [sortBy, setSortBy] = useState("username");

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "user"));
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Delete user
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "user", id));
      setUsers(users.filter((u) => u.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Open Add Staff dialog
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      salary: "",
      joining_date: "",
      active: true,
      username: "",
      password: "", // ✅ reset password
    });
    setOpen(true);
  };

  // Open Edit Staff dialog
  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setEditUserId(user.id);
    setFormData(user);
    setOpen(true);
  };

  // Save (Add or Update)
  const handleSave = async () => {
    try {
      // ✅ Validation
      if (!/^\d{10}$/.test(formData.phone)) {
        alert("Phone number must be exactly 10 digits");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert("Invalid email format");
        return;
      }
      if (!formData.joining_date) {
        alert("Joining date is required");
        return;
      }
      if (!formData.password) {
        alert("Password is required");
        return;
      }

      // ✅ Check unique username when adding
      if (!isEditing) {
        const q = query(
          collection(db, "user"),
          where("username", "==", formData.username)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          alert("Username already exists!");
          return;
        }
      }

      if (isEditing) {
        // Update existing user
        const userRef = doc(db, "user", editUserId);
        await updateDoc(userRef, formData);

        setUsers(
          users.map((u) =>
            u.id === editUserId ? { id: editUserId, ...formData } : u
          )
        );
      } else {
        // Add new user
        const docRef = await addDoc(collection(db, "user"), formData);
        setUsers([...users, { id: docRef.id, ...formData }]);
      }

      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        salary: "",
        joining_date: "",
        active: true,
        username: "",
        password: "", // ✅ reset password
      });
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "username") return a.username.localeCompare(b.username);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "salary") return Number(a.salary) - Number(b.salary);
    if (sortBy === "joining_date")
      return new Date(a.joining_date) - new Date(b.joining_date);
    return 0;
  });

  return (
    <Box sx={{ p: 3, backgroundColor: "#f9f9e5", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Staff Management</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="username">Username</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="salary">Salary</MenuItem>
              <MenuItem value="joining_date">Joining Date</MenuItem>
            </Select>
          </FormControl>
          <Button
          variant="contained"
          color="primary"
          sx={{ marginLeft: "auto" }} // pushes button to right-most side
          onClick={() => navigate("/attendance")}
        >
          Attendance
        </Button>
          <Button variant="contained" color="primary" onClick={handleOpenAdd}>
            Add Staff
          </Button>
        </Box>
      </Box>

      {/* User list */}
      {sortedUsers.map((user) => (
        <Paper
          key={user.id}
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Username row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{ cursor: "pointer" }}
              onClick={() =>
                setExpandedUser(expandedUser === user.id ? null : user.id)
              }
            >
              {user.username} {/* show username in row */}
            </Typography>

            <Box>
              <IconButton color="primary" onClick={() => handleOpenEdit(user)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(user.id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton
                onClick={() =>
                  setExpandedUser(expandedUser === user.id ? null : user.id)
                }
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Expandable details */}
          <Collapse in={expandedUser === user.id}>
            <Box sx={{ mt: 2 }}>
              <Typography>Username: {user.username}</Typography>
              <Typography>Full Name: {user.name}</Typography>
              <Typography>Role: {user.role}</Typography>
              <Typography>Email: {user.email}</Typography>
              <Typography>Phone Number: {user.phone}</Typography>
              <Typography>Salary: {user.salary}</Typography>
              <Typography>
                Joining Date:{" "}
                {user.joining_date
                  ? new Date(user.joining_date).toLocaleDateString()
                  : ""}
              </Typography>
              <Typography>
                Name Active: {user.active ? "true" : "false"}
              </Typography>
            </Box>
          </Collapse>
        </Paper>
      ))}

      {/* Add/Edit Staff Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isEditing ? "Edit Staff" : "Add Staff"}</DialogTitle>
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
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Salary"
            type="number"
            value={formData.salary}
            onChange={(e) =>
              setFormData({ ...formData, salary: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Joining Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.joining_date}
            onChange={(e) =>
              setFormData({ ...formData, joining_date: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
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
