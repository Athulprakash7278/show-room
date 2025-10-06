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
  Menu,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SortIcon from "@mui/icons-material/SwapVert";
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

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [expandedCar, setExpandedCar] = useState(null);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCarId, setEditCarId] = useState(null);
  const [formData, setFormData] = useState({
    manufacturer_name: "",
    car_name: "",
    ownership_number: "",
    model: "",
    registeration_number: "",
    kilometer: "",
    colour: "",
    asking_price: "",
    sold: false,
  });

  // Sort states
  const [sortAnchor, setSortAnchor] = useState(null);

  // Fetch cars
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "car"));
        const carsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCars(carsData);
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };

    fetchCars();
  }, []);

  // Delete car
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "car", id));
      setCars(cars.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  // Open Add Car dialog
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      manufacturer_name: "",
      car_name: "",
      ownership_number: "",
      model: "",
      registeration_number: "",
      kilometer: "",
      colour: "",
      asking_price: "",
      sold: false,
    });
    setOpen(true);
  };

  // Open Edit Car dialog
  const handleOpenEdit = (car) => {
    setIsEditing(true);
    setEditCarId(car.id);
    setFormData(car);
    setOpen(true);
  };

  // Save (Add or Update)
  const handleSave = async () => {
    try {
      // check ownership_number unique
      const q = query(
        collection(db, "car"),
        where("ownership_number", "==", formData.ownership_number)
      );
      const querySnapshot = await getDocs(q);

      const duplicate = querySnapshot.docs.find(
        (d) => d.id !== editCarId
      );

      if (duplicate) {
        alert("Ownership number must be unique!");
        return;
      }

      if (isEditing) {
        const carRef = doc(db, "car", editCarId);
        await updateDoc(carRef, formData);
        setCars(
          cars.map((c) =>
            c.id === editCarId ? { id: editCarId, ...formData } : c
          )
        );
      } else {
        const docRef = await addDoc(collection(db, "car"), formData);
        setCars([...cars, { id: docRef.id, ...formData }]);
      }

      setOpen(false);
      setFormData({
        manufacturer_name: "",
        car_name: "",
        ownership_number: "",
        model: "",
        registeration_number: "",
        kilometer: "",
        colour: "",
        asking_price: "",
        sold: false,
      });
    } catch (error) {
      console.error("Error saving car:", error);
    }
  };

  // Sorting
  const handleSort = (field) => {
    const sorted = [...cars].sort((a, b) => {
      if (typeof a[field] === "number") {
        return a[field] - b[field];
      }
      return a[field].localeCompare(b[field]);
    });
    setCars(sorted);
    setSortAnchor(null);
  };

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
        <Typography variant="h4">Cars</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenAdd}>
          + Add Car
        </Button>
      </Box>

      {/* Sort Menu */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<SortIcon />}
          onClick={(e) => setSortAnchor(e.currentTarget)}
          sx={{ textTransform: "none" }}
        >
          Sort
        </Button>
        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
        >
          <MenuItem onClick={() => handleSort("ownership_number")}>
            Ownership Number
          </MenuItem>
          <MenuItem onClick={() => handleSort("kilometer")}>
            Kilometer
          </MenuItem>
          <MenuItem onClick={() => handleSort("asking_price")}>
            Asking Price
          </MenuItem>
        </Menu>
      </Box>

      {/* Car List */}
      {cars.map((car) => (
        <Paper
          key={car.id}
          sx={{ p: 2, mb: 2, display: "flex", flexDirection: "column" }}
        >
          {/* Row */}
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
                setExpandedCar(expandedCar === car.id ? null : car.id)
              }
            >
              {car.manufacturer_name}
            </Typography>

            <Box>
              <IconButton color="primary" onClick={() => handleOpenEdit(car)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(car.id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton
                onClick={() =>
                  setExpandedCar(expandedCar === car.id ? null : car.id)
                }
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Expandable Details */}
          <Collapse in={expandedCar === car.id}>
            <Box sx={{ mt: 2 }}>
              <Typography>Manufacturer: {car.manufacturer_name}</Typography>
              <Typography>Car Name: {car.car_name}</Typography>
              <Typography>Ownership Number: {car.ownership_number}</Typography>
              <Typography>Model: {car.model}</Typography>
              <Typography>Registration Number: {car.registeration_number}</Typography>
              <Typography>Kilometer: {car.kilometer}</Typography>
              <Typography>Colour: {car.colour}</Typography>
              <Typography>Asking Price: {car.asking_price}</Typography>
              <Typography>Sold: {car.sold ? "true" : "false"}</Typography>
            </Box>
          </Collapse>
        </Paper>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isEditing ? "Edit Car" : "Add Car"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Manufacturer Name"
            value={formData.manufacturer_name}
            onChange={(e) =>
              setFormData({ ...formData, manufacturer_name: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Car Name"
            value={formData.car_name}
            onChange={(e) =>
              setFormData({ ...formData, car_name: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Ownership Number"
            type="number"
            value={formData.ownership_number}
            onChange={(e) =>
              setFormData({ ...formData, ownership_number: Number(e.target.value) })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Model"
            type="number"
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: Number(e.target.value) })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Registration Number"
            value={formData.registeration_number}
            onChange={(e) =>
              setFormData({ ...formData, registeration_number: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Kilometer"
            type="number"
            value={formData.kilometer}
            onChange={(e) =>
              setFormData({ ...formData, kilometer: Number(e.target.value) })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Colour"
            value={formData.colour}
            onChange={(e) =>
              setFormData({ ...formData, colour: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Asking Price"
            type="number"
            value={formData.asking_price}
            onChange={(e) =>
              setFormData({ ...formData, asking_price: Number(e.target.value) })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Sold (true/false)"
            value={formData.sold}
            onChange={(e) =>
              setFormData({ ...formData, sold: e.target.value === "true" })
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
