// Service.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Service() {
  const [services, setServices] = useState([]);
  const [expandedService, setExpandedService] = useState(null);

  // Dialog states
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // Add service form
  const [formData, setFormData] = useState({
    customer_name: "",
    car_name: "",
    registration_number: "",
    phone: "",
    staff_name: "",
    final_status: false,
    jobs: [],
  });

  // Job being added in add dialog
  const [newJob, setNewJob] = useState({
    type: "",
    sub_type: "",
    portion: "",
    status: "Pending",
    rate: "",
  });

  // Edit dialog
  const [editingService, setEditingService] = useState(null);
  const [editJob, setEditJob] = useState({
    type: "",
    sub_type: "",
    portion: "",
    status: "Pending",
    rate: "",
  });
  const [editingJob, setEditingJob] = useState(null);

  // Fetch services with jobs
  const fetchServices = async () => {
    try {
      const svcSnap = await getDocs(collection(db, "service"));
      const arr = await Promise.all(
        svcSnap.docs.map(async (d) => {
          const serviceId = d.id;
          const jobsSnap = await getDocs(collection(db, "service", serviceId, "jobs"));
          const jobs = jobsSnap.docs.map((j) => ({ id: j.id, ...j.data() }));
          return { id: serviceId, ...d.data(), jobs };
        })
      );
      arr.sort(
        (a, b) =>
          new Date(b.created_at?.toDate?.() || 0) - new Date(a.created_at?.toDate?.() || 0)
      );
      setServices(arr);
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // ---------------- ADD SERVICE + JOB ----------------
  const handleAddJobToForm = () => {
    if (!newJob.type || !newJob.portion || newJob.rate === "") {
      alert("Please fill Type, Portion, and Rate.");
      return;
    }

    if (["Coating", "PPF"].includes(newJob.type)) {
      const duplicate = formData.jobs.find(
        (j) => j.type === newJob.type && j.portion.toLowerCase() === newJob.portion.toLowerCase()
      );
      if (duplicate) {
        alert(`Only one ${newJob.type} per portion allowed.`);
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      jobs: [...prev.jobs, { ...newJob, rate: Number(newJob.rate) }],
    }));
    setNewJob({ type: "", sub_type: "", portion: "", status: "Pending", rate: "" });
  };

  const handleSaveService = async () => {
    if (!formData.customer_name || !formData.car_name || !formData.registration_number) {
      alert("Fill customer name, car name, registration number.");
      return;
    }

    try {
      const serviceRef = await addDoc(collection(db, "service"), {
        customer_name: formData.customer_name,
        car_name: formData.car_name,
        registration_number: formData.registration_number,
        phone: formData.phone,
        staff_name: formData.staff_name,
        final_status: false,
        created_at: serverTimestamp(),
      });

      const addedJobs = [];
      for (const job of formData.jobs) {
        const jobRef = await addDoc(collection(db, "service", serviceRef.id, "jobs"), {
          ...job,
          created_at: serverTimestamp(),
        });
        addedJobs.push({ id: jobRef.id, ...job, created_at: new Date() });
      }

      setServices((prev) => [
        { id: serviceRef.id, ...formData, jobs: addedJobs, created_at: new Date() },
        ...prev,
      ]);
      setFormData({
        customer_name: "",
        car_name: "",
        registration_number: "",
        phone: "",
        staff_name: "",
        final_status: false,
        jobs: [],
      });
      setOpenAdd(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add service");
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Delete service and all jobs?")) return;
    try {
      const jobsSnap = await getDocs(collection(db, "service", serviceId, "jobs"));
      await Promise.all(
        jobsSnap.docs.map((j) => deleteDoc(doc(db, "service", serviceId, "jobs", j.id)))
      );
      await deleteDoc(doc(db, "service", serviceId));
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // ---------------- EDIT SERVICE + JOB ----------------
  const openEditDialog = (service) => {
    setEditingService(service);
    setOpenEdit(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setEditJob({ ...job });
  };

  const handleAddJobToExisting = async () => {
    if (!editJob.type || !editJob.portion || editJob.rate === "") {
      alert("Fill Type, Portion, Rate");
      return;
    }
    if (["Coating", "PPF"].includes(editJob.type)) {
      const duplicate = editingService.jobs.find(
        (j) => j.type === editJob.type && j.portion.toLowerCase() === editJob.portion.toLowerCase()
      );
      if (duplicate) {
        alert(`Only one ${editJob.type} per portion allowed`);
        return;
      }
    }

    try {
      const jobRef = await addDoc(collection(db, "service", editingService.id, "jobs"), {
        ...editJob,
        rate: Number(editJob.rate),
        created_at: serverTimestamp(),
      });

      setEditingService((prev) => ({
        ...prev,
        jobs: [...prev.jobs, { id: jobRef.id, ...editJob, created_at: new Date() }],
      }));
      setEditJob({ type: "", sub_type: "", portion: "", status: "Pending", rate: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add job");
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    try {
      const jobRef = doc(db, "service", editingService.id, "jobs", editingJob.id);
      await updateDoc(jobRef, { ...editJob, rate: Number(editJob.rate) });

      setEditingService((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => (j.id === editingJob.id ? { ...editJob, id: j.id } : j)),
      }));
      setEditingJob(null);
      setEditJob({ type: "", sub_type: "", portion: "", status: "Pending", rate: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to update job");
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, "service", editingService.id, "jobs", jobId));
      setEditingService((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((j) => j.id !== jobId),
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to delete job");
    }
  };

  const handleUpdateServiceDetails = async () => {
    try {
      const allCompleted = editingService.jobs.every((j) => j.status === "Completed");
      const serviceRef = doc(db, "service", editingService.id);
      await updateDoc(serviceRef, { ...editingService, final_status: allCompleted });

      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id ? { ...editingService, final_status: allCompleted } : s
        )
      );
      setOpenEdit(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update service");
    }
  };

  // ---------------- INVOICE ----------------
  const handleCreateInvoice = (service) => {
  if (!service?.jobs?.length) {
    alert("No jobs to generate invoice.");
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.text("Auto Service Invoice", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Invoice ID: ${service.id}`, 20, 35);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35, { align: "right" });
  doc.text(`Customer Name: ${service.customer_name}`, 20, 45);
  doc.text(`Car: ${service.car_name}`, 20, 55);
  doc.text(`Registration No.: ${service.registration_number}`, 20, 65);
  doc.text(`Phone: ${service.phone || "—"}`, 20, 75);
  doc.text(`Staff: ${service.staff_name || "—"}`, 20, 85);

  const tableColumn = ["#", "Type", "Sub Type", "Portion", "Rate (₹)", "Status"];
  const tableRows = [];
  let totalAmount = 0;

  service.jobs.forEach((job, index) => {
    tableRows.push([
      index + 1,
      job.type || "-",
      job.sub_type || "-",
      job.portion || "-",
      job.rate || 0,
      job.status || "-",
    ]);
    totalAmount += Number(job.rate) || 0;
  });

  // ✅ v5 syntax
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 95,
    styles: { fontSize: 11 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });

  const finalY = doc.lastAutoTable?.finalY || 95;
  doc.setFontSize(14);
  doc.text(`Total Amount: ₹${totalAmount}`, 150, finalY + 15, { align: "right" });

  doc.setFontSize(10);
  doc.text("Thank you for choosing our service!", 105, finalY + 30, { align: "center" });
  doc.text("Powered by Your Auto Service Center", 105, finalY + 36, { align: "center" });

  doc.save(`Invoice_${service.customer_name.replace(/\s/g,'_')}_${service.id}.pdf`);
};

  // ---------------- RENDER ----------------
  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f7fb", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Service Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
        >
          + Add Service
        </Button>
      </Box>

      {services.length === 0 && <Typography>No services found.</Typography>}

      {services.map((s) => (
        <Paper key={s.id} sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6">{s.customer_name}</Typography>
              <Typography sx={{ fontSize: 13 }}>
                {s.car_name} — {s.registration_number}
              </Typography>
              <Typography>Staff: {s.staff_name || "—"}</Typography>
            </Box>
            <Box>
              <IconButton
                onClick={() =>
                  setExpandedService(expandedService === s.id ? null : s.id)
                }
              >
                <ExpandMoreIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDeleteService(s.id)}>
                <DeleteIcon />
              </IconButton>
              <Button
                onClick={() => openEditDialog(s)}
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
              >
                Edit
              </Button>
            </Box>
          </Box>

          <Collapse in={expandedService === s.id}>
            <Box sx={{ mt: 2 }}>
              <Typography>Phone: {s.phone || "—"}</Typography>
              <Typography>
                Final Status: {s.final_status ? "Completed" : "Pending"}
              </Typography>
              <Typography sx={{ mt: 1, fontWeight: "bold" }}>Jobs:</Typography>
              {s.jobs?.length > 0 ? (
                s.jobs.map((j) => (
                  <Paper key={j.id} sx={{ p: 1, mt: 1 }}>
                    <Typography>
                      {j.type} {j.sub_type ? `(${j.sub_type})` : ""} — {j.portion} — ₹
                      {j.rate} — {j.status}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography>No jobs</Typography>
              )}

              {/* Always show Generate Invoice */}
              {s.final_status && s.jobs.length > 0 && (
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => handleCreateInvoice(s)}
                >
                  Generate Invoice
                </Button>
              )}
            </Box>
          </Collapse>
        </Paper>
      ))}

      {/* ---------------- ADD SERVICE DIALOG ---------------- */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth>
        <DialogTitle>Add Service</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Customer Name"
            value={formData.customer_name}
            onChange={(e) =>
              setFormData({ ...formData, customer_name: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Car Name"
            value={formData.car_name}
            onChange={(e) => setFormData({ ...formData, car_name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Registration Number"
            value={formData.registration_number}
            onChange={(e) =>
              setFormData({ ...formData, registration_number: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Staff Name"
            value={formData.staff_name}
            onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Jobs
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              select
              label="Type"
              value={newJob.type}
              onChange={(e) =>
                setNewJob({ ...newJob, type: e.target.value, sub_type: "" })
              }
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="Coating">Coating</MenuItem>
              <MenuItem value="PPF">PPF</MenuItem>
              <MenuItem value="Sunfilm">Sunfilm</MenuItem>
              <MenuItem value="Outside Work">Outside Work</MenuItem>
            </TextField>

            <Autocomplete
              freeSolo
              options={
                newJob.type === "Coating"
                  ? ["Ceramic", "Graphene", "Teflon"]
                  : newJob.type === "PPF"
                  ? ["Glossy", "Matte"]
                  : []
              }
              value={newJob.sub_type}
              onChange={(event, newValue) =>
                setNewJob({ ...newJob, sub_type: newValue || "" })
              }
              onInputChange={(event, newInputValue) =>
                setNewJob({ ...newJob, sub_type: newInputValue })
              }
              renderInput={(params) => <TextField {...params} label="Sub Type" sx={{ minWidth: 140 }} />}
            />

            <TextField
              label="Portion"
              value={newJob.portion}
              onChange={(e) => setNewJob({ ...newJob, portion: e.target.value })}
              sx={{ minWidth: 120 }}
            />
            <TextField
              label="Rate"
              type="number"
              value={newJob.rate}
              onChange={(e) => setNewJob({ ...newJob, rate: e.target.value })}
              sx={{ width: 100 }}
            />
            <Button variant="contained" onClick={handleAddJobToForm}>
              + Add Job
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            {formData.jobs.length === 0 ? (
              <Typography>No jobs added</Typography>
            ) : (
              formData.jobs.map((j, idx) => (
                <Paper key={idx} sx={{ p: 1, mb: 1 }}>
                  <Typography>
                    {j.type} {j.sub_type ? `(${j.sub_type})` : ""} — {j.portion} — ₹
                    {j.rate}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleSaveService} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- EDIT SERVICE DIALOG ---------------- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent>
          {editingService && (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Customer Name"
                value={editingService.customer_name}
                onChange={(e) =>
                  setEditingService({ ...editingService, customer_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Car Name"
                value={editingService.car_name}
                onChange={(e) =>
                  setEditingService({ ...editingService, car_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Registration Number"
                value={editingService.registration_number}
                onChange={(e) =>
                  setEditingService({ ...editingService, registration_number: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Phone"
                value={editingService.phone}
                onChange={(e) =>
                  setEditingService({ ...editingService, phone: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="dense"
                label="Staff Name"
                value={editingService.staff_name}
                onChange={(e) =>
                  setEditingService({ ...editingService, staff_name: e.target.value })
                }
              />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Jobs
              </Typography>

              {editingService.jobs.map((j) => (
                <Paper key={j.id} sx={{ p: 1, mt: 1 }}>
                  <Typography>
                    {j.type} {j.sub_type ? `(${j.sub_type})` : ""} — {j.portion} — ₹
                    {j.rate} — {j.status}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => handleEditJob(j)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteJob(j.id)}
                  >
                    Delete
                  </Button>
                </Paper>
              ))}

              {/* Edit job section */}
              {editingJob && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <TextField
                    label="Type"
                    value={editJob.type}
                    onChange={(e) => setEditJob({ ...editJob, type: e.target.value })}
                    sx={{ minWidth: 120, mr: 1 }}
                  />
                  <TextField
                    label="Sub Type"
                    value={editJob.sub_type}
                    onChange={(e) => setEditJob({ ...editJob, sub_type: e.target.value })}
                    sx={{ minWidth: 120, mr: 1 }}
                  />
                  <TextField
                    label="Portion"
                    value={editJob.portion}
                    onChange={(e) => setEditJob({ ...editJob, portion: e.target.value })}
                    sx={{ minWidth: 120, mr: 1 }}
                  />
                  <TextField
                    label="Rate"
                    type="number"
                    value={editJob.rate}
                    onChange={(e) => setEditJob({ ...editJob, rate: e.target.value })}
                    sx={{ width: 100, mr: 1 }}
                  />
                  <TextField
                    select
                    label="Status"
                    value={editJob.status}
                    onChange={(e) => setEditJob({ ...editJob, status: e.target.value })}
                    sx={{ minWidth: 120, mr: 1 }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </TextField>
                  <Button variant="contained" onClick={handleUpdateJob}>
                    Update Job
                  </Button>
                </Box>
              )}

              {/* Add new job to existing service */}
              <Box sx={{ mt: 2, borderTop: "1px solid #ccc", pt: 2 }}>
                <Typography variant="subtitle1">Add Job</Typography>
                <TextField
                  select
                  label="Type"
                  value={editJob.type}
                  onChange={(e) =>
                    setEditJob({ ...editJob, type: e.target.value, sub_type: "" })
                  }
                  sx={{ minWidth: 120, mr: 1 }}
                >
                  <MenuItem value="Coating">Coating</MenuItem>
                  <MenuItem value="PPF">PPF</MenuItem>
                  <MenuItem value="Sunfilm">Sunfilm</MenuItem>
                  <MenuItem value="Outside Work">Outside Work</MenuItem>
                </TextField>
                <TextField
                  label="Sub Type"
                  value={editJob.sub_type}
                  onChange={(e) => setEditJob({ ...editJob, sub_type: e.target.value })}
                  sx={{ minWidth: 120, mr: 1 }}
                />
                <TextField
                  label="Portion"
                  value={editJob.portion}
                  onChange={(e) => setEditJob({ ...editJob, portion: e.target.value })}
                  sx={{ minWidth: 120, mr: 1 }}
                />
                <TextField
                  label="Rate"
                  type="number"
                  value={editJob.rate}
                  onChange={(e) => setEditJob({ ...editJob, rate: e.target.value })}
                  sx={{ width: 100, mr: 1 }}
                />
                <Button variant="contained" onClick={handleAddJobToExisting}>
                  + Add Job
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleUpdateServiceDetails} variant="contained">
            Update Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
