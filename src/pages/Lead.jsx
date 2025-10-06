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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";

export default function Lead() {
  const [leads, setLeads] = useState([]);
  const [expandedLead, setExpandedLead] = useState(null);

  // Dialog states
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLeadId, setEditLeadId] = useState(null);
  const [formData, setFormData] = useState({
    Customer_name: "",
    Phone_number: "",
    Source_of_lead: "",
    status: "hot",
    Assigned_person: "",
    Created_by: "",
    Final_stamp: "",
    Created_date: new Date(),
  });

  // Follow-up data for new leads
  const [newFollowups, setNewFollowups] = useState([
    { date: new Date(), description: "" },
  ]);

  // Follow-up dialog (for adding later)
  const [openFollowupDialog, setOpenFollowupDialog] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [followupData, setFollowupData] = useState({
    date: new Date(),
    description: "",
  });

  // Fetch leads with followups
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "lead"));
        const leadsData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // Fetch subcollection "followup"
            const followupsSnapshot = await getDocs(
              collection(db, "lead", docSnap.id, "followup")
            );
            const followups = followupsSnapshot.docs.map((fDoc) => ({
              id: fDoc.id,
              ...fDoc.data(),
            }));

            return { id: docSnap.id, ...data, followup: followups };
          })
        );

        // Sort latest first
        leadsData.sort(
          (a, b) =>
            (b.Created_date?.toDate
              ? b.Created_date.toDate()
              : new Date(b.Created_date)) -
            (a.Created_date?.toDate
              ? a.Created_date.toDate()
              : new Date(a.Created_date))
        );

        setLeads(leadsData);
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    };

    fetchLeads();
  }, []);

  // Delete lead
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "lead", id));
      setLeads(leads.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  // Open Add Lead dialog
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      Customer_name: "",
      Phone_number: "",
      Source_of_lead: "",
      status: "hot",
      Assigned_person: "",
      Created_by: "",
      Final_stamp: "",
      Created_date: new Date(),
    });
    setNewFollowups([{ date: new Date(), description: "" }]);
    setOpen(true);
  };

  // Open Edit Lead dialog
  const handleOpenEdit = (lead) => {
    setIsEditing(true);
    setEditLeadId(lead.id);
    setFormData(lead);
    setOpen(true);
  };

  // Save Lead (Add or Update)
  const handleSave = async () => {
    try {
      if (isEditing) {
        const leadRef = doc(db, "lead", editLeadId);
        await updateDoc(leadRef, formData);
        setLeads(
          leads.map((l) =>
            l.id === editLeadId ? { id: editLeadId, ...formData } : l
          )
        );
      } else {
        // Add main lead doc
        const docRef = await addDoc(collection(db, "lead"), {
          ...formData,
          Created_date: serverTimestamp(),
        });

        // Add follow-ups to subcollection
        for (const f of newFollowups) {
          if (f.description.trim() !== "") {
            await addDoc(collection(db, "lead", docRef.id, "followup"), {
              date: f.date,
              description: f.description,
            });
          }
        }

        setLeads([{ id: docRef.id, ...formData }, ...leads]);
      }
      setOpen(false);
    } catch (error) {
      console.error("Error saving lead:", error);
    }
  };

  // Add follow-up later (existing leads)
  const handleAddFollowup = async () => {
    try {
      const followupRef = collection(db, "lead", currentLeadId, "followup");
      await addDoc(followupRef, {
        date: followupData.date,
        description: followupData.description,
      });
      setOpenFollowupDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding followup:", error);
    }
  };

  // Status color helper
  const getStatusColor = (createdDate) => {
    if (!createdDate) return "#ddd";
    const date =
      createdDate.toDate?.() instanceof Date
        ? createdDate.toDate()
        : new Date(createdDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return "#ffcccc";
    if (diffDays <= 7) return "#fff2cc";
    return "#cce5ff";
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
        <Typography variant="h4">Lead Management</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenAdd}>
          + Add Lead
        </Button>
      </Box>

      {/* Lead List */}
      {leads.map((lead) => (
        <Paper
          key={lead.id}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: getStatusColor(lead.Created_date),
            display: "flex",
            flexDirection: "column",
          }}
        >
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
                setExpandedLead(expandedLead === lead.id ? null : lead.id)
              }
            >
              {lead.Customer_name}
            </Typography>

            <Box>
              <IconButton color="primary" onClick={() => handleOpenEdit(lead)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(lead.id)}>
                <DeleteIcon />
              </IconButton>
              <IconButton
                onClick={() =>
                  setExpandedLead(expandedLead === lead.id ? null : lead.id)
                }
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Expandable Details */}
          <Collapse in={expandedLead === lead.id}>
            <Box sx={{ mt: 2 }}>
              <Typography>Customer: {lead.Customer_name}</Typography>
              <Typography>Phone: {lead.Phone_number}</Typography>
              <Typography>Source: {lead.Source_of_lead}</Typography>
              <Typography>Status: {lead.status}</Typography>
              <Typography>Assigned: {lead.Assigned_person}</Typography>
              <Typography>Created By: {lead.Created_by}</Typography>
              <Typography>Final Stamp: {lead.Final_stamp}</Typography>
              <Typography>
                Created Date:{" "}
                {lead.Created_date?.toDate
                  ? lead.Created_date.toDate().toLocaleString()
                  : lead.Created_date?.toString()}
              </Typography>

              <Typography sx={{ mt: 1, fontWeight: "bold" }}>
                Follow-ups:
              </Typography>
              {lead.followup && lead.followup.length > 0 ? (
                lead.followup.map((f) => (
                  <Typography key={f.id}>
                    {f.date?.toDate
                      ? f.date.toDate().toLocaleString()
                      : f.date?.toString()}{" "}
                    - {f.description}
                  </Typography>
                ))
              ) : (
                <Typography>No follow-ups</Typography>
              )}

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setCurrentLeadId(lead.id);
                  setFollowupData({ date: new Date(), description: "" });
                  setOpenFollowupDialog(true);
                }}
                sx={{ mt: 1 }}
              >
                + Add Follow-up
              </Button>
            </Box>
          </Collapse>
        </Paper>
      ))}

      {/* Add/Edit Lead Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{isEditing ? "Edit Lead" : "Add Lead"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Customer Name"
            value={formData.Customer_name}
            onChange={(e) =>
              setFormData({ ...formData, Customer_name: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Phone Number"
            type="number"
            value={formData.Phone_number}
            onChange={(e) =>
              setFormData({ ...formData, Phone_number: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Source of Lead"
            value={formData.Source_of_lead}
            onChange={(e) =>
              setFormData({ ...formData, Source_of_lead: e.target.value })
            }
          />
          {isEditing && (
            <TextField
              select
              fullWidth
              margin="dense"
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="hot">Hot</MenuItem>
              <MenuItem value="warm">Warm</MenuItem>
              <MenuItem value="cold">Cold</MenuItem>
            </TextField>
          )}
          <TextField
            fullWidth
            margin="dense"
            label="Assigned Person"
            value={formData.Assigned_person}
            onChange={(e) =>
              setFormData({ ...formData, Assigned_person: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Created By"
            value={formData.Created_by}
            onChange={(e) =>
              setFormData({ ...formData, Created_by: e.target.value })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Final Stamp"
            value={formData.Final_stamp}
            onChange={(e) =>
              setFormData({ ...formData, Final_stamp: e.target.value })
            }
          />

          {/* Follow-up section for new lead */}
          {!isEditing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Follow-ups for this Lead:
              </Typography>
              {newFollowups.map((f, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <TextField
                    type="datetime-local"
                    label="Date"
                    value={
                      f.date instanceof Date
                        ? f.date.toISOString().slice(0, 16)
                        : f.date
                    }
                    onChange={(e) => {
                      const updated = [...newFollowups];
                      updated[idx].date = new Date(e.target.value);
                      setNewFollowups(updated);
                    }}
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    value={f.description}
                    onChange={(e) => {
                      const updated = [...newFollowups];
                      updated[idx].description = e.target.value;
                      setNewFollowups(updated);
                    }}
                    fullWidth
                  />
                </Box>
              ))}
              <Button
                variant="outlined"
                size="small"
                onClick={() =>
                  setNewFollowups([
                    ...newFollowups,
                    { date: new Date(), description: "" },
                  ])
                }
              >
                + Add Another Follow-up
              </Button>
            </Box>
          )}
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

      {/* Add Follow-up Dialog (existing leads) */}
      <Dialog
        open={openFollowupDialog}
        onClose={() => setOpenFollowupDialog(false)}
      >
        <DialogTitle>Add Follow-up</DialogTitle>
        <DialogContent>
          <TextField
            type="datetime-local"
            fullWidth
            margin="dense"
            label="Follow-up Date"
            value={
              followupData.date instanceof Date
                ? followupData.date.toISOString().slice(0, 16)
                : followupData.date
            }
            onChange={(e) =>
              setFollowupData({ ...followupData, date: new Date(e.target.value) })
            }
          />
          <TextField
            fullWidth
            margin="dense"
            label="Description"
            value={followupData.description}
            onChange={(e) =>
              setFollowupData({ ...followupData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFollowupDialog(false)}>Cancel</Button>
          <Button onClick={handleAddFollowup} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
