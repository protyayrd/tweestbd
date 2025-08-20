// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import { Avatar, CardHeader, Pagination, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/admin/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCustomers(response.data);
      
      // Calculate total pages
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError(error.message || "Failed to fetch customers");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handlePaginationChange = (event, value) => {
    setCurrentPage(value);
  };

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', color: 'red' }}>
        Error: {error}
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title='All Customers'
          sx={{ pt: 2, alignItems: 'center', '& .MuiCardHeader-action': { mt: 0.6 } }}
        />
        <TableContainer>
          <Table sx={{ minWidth: 390 }} aria-label='table in dashboard'>
            <TableHead>
              <TableRow>
                <TableCell>User Id</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentCustomers.length > 0 ? (
                currentCustomers.map((customer, index) => (
                  <TableRow hover key={customer._id} sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell>{`${customer.firstName} ${customer.lastName}`}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No customers found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      {customers.length > 0 && (
        <Card className="mt-2 flex justify-center items-center">
          <Pagination
            className="py-5 w-auto"
            size="large"
            count={totalPages}
            page={currentPage}
            color="primary"
            onChange={handlePaginationChange}
          />
        </Card>
      )}
    </Box>
  );
};

export default Customers;
