import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';

const title = 'ShowRoom';
const pages = [
  { name: 'Home Page', path: '/' },
  { name: 'Staff Management', path: '/staffmanagement' },
  { name: 'Cars', path: '/cars' },
  { name: 'Lead', path: '/lead' },
  { name: 'Jobs', path: '/jobs' },
];

export const NavigationBar = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/login'); // redirect to login after logout
  };

  const username = localStorage.getItem('username');

  // If not logged in, hide drawer/menu
  if (!username) return null;

  return (
    <>
      {/* AppBar */}
      <AppBar position="static" sx={{ backgroundColor: '#0B0C10', boxShadow: 'none' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="#"
              sx={{
                mr: 2,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: '#66FCF1',
                textDecoration: 'none',
              }}
            >
              {title}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            {/* Username Button Menu */}
            <Box sx={{ mr: 1 }}>
              <Tooltip title="Open menu">
                <Button
                  onClick={handleOpenUserMenu}
                  sx={{ color: '#66FCF1', textTransform: 'none' }}
                >
                  {username || 'User'}
                </Button>
              </Tooltip>

              <Menu
                sx={{ mt: '45px' }}
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{ sx: { backgroundColor: '#1F2833', color: '#C5C6C7' } }}
              >
                <MenuItem
                  onClick={() => {
                    handleLogout();
                    handleCloseUserMenu();
                  }}
                  sx={{ '&:hover': { backgroundColor: '#66FCF1', color: '#0B0C10' } }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>

            {/* Drawer Menu Button */}
            <Box>
              <IconButton
                size="large"
                aria-label="app menu"
                onClick={() => setDrawerOpen(true)}
                sx={{ color: '#66FCF1' }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, backgroundColor: '#1F2833', color: '#C5C6C7' } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#66FCF1' }}>
            MENU
          </Typography>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />
          <List>
            {pages.map((page) => (
              <ListItem key={page.name} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(page.path);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    bgcolor: location.pathname === page.path ? '#66FCF144' : 'inherit',
                    '&:hover': { backgroundColor: '#66FCF144', color: '#0B0C10' },
                  }}
                >
                  <ListItemText primary={page.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};
