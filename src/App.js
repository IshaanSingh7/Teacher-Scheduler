import { Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './components/Login';
import Welcome from './components/Welcome';
import LinkLogin from './components/LinkLogin';
import SubstituteHome from './components/SubstituteHome';
import TeacherHome from './components/TeacherHome';
import AdminHome from './components/AdminHome';
import AdminEditor from './components/AdminEditor';
import AdminScheduler from './components/AdminScheduler';
import AdminAdd from './components/AdminAdd';
import TeacherScheduler from './components/TeacherScheduler';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#E6F0FA',
      100: '#C6E0F5',
      500: '#3182CE',
      600: '#2B6CB0',
    },
  },
  fonts: {
    heading: `'Roboto', sans-serif`,
    body: `'Roboto', sans-serif`,
  },
});

const ProtectedRoute = ({ element: Component }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? Component : <Login />;
};

const App = () => (
  <ChakraProvider theme={theme}>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/welcome" element={<ProtectedRoute element={<Welcome />} />} />
        <Route path="/teacher-scheduler" element={<ProtectedRoute element={<TeacherScheduler />} />} />
        <Route path="/sub-home" element={<ProtectedRoute element={<SubstituteHome />} />} />
        <Route path="/teacher-home" element={<ProtectedRoute element={<TeacherHome />} />} />
        <Route path="/LinkLogin" element={<LinkLogin />} />
        <Route path="/admin-home" element={<ProtectedRoute element={<AdminHome />} />} />
        <Route path="/admin-editor" element={<ProtectedRoute element={<AdminEditor />} />} />
        <Route path="/admin-scheduler" element={<ProtectedRoute element={<AdminScheduler />} />} />
        <Route path="/admin-add" element={<ProtectedRoute element={<AdminAdd />} />} />
      </Routes>
    </AuthProvider>
  </ChakraProvider>
);

export default App;







// useEffect(() => {
//   const user = localStorage.getItem('user');
//   if (user) {
//     setIsAuthenticated(true);
//     navigate('/scheduler');
//   } else {
//     setIsAuthenticated(false); // Reset authentication on page load if no user
//   }
// }, [navigate]);

// const navigate = useNavigate();
// const [isAuthenticated, setIsAuthenticated] = useState(false);



// const handleLoginSuccess = (credential) => {
//   localStorage.setItem('user', credential);
//   setIsAuthenticated(true);
//   navigate('/scheduler');
// };

// const handleLogout = () => {
//   localStorage.removeItem('user');
//   setIsAuthenticated(false);
//   navigate('/');
// };

    // <GoogleOAuthProvider clientId="534181681256-flbpilibla9o4oqvr44a9227lu460m2s.apps.googleusercontent.com">
    //   <Routes>
    //     <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
    //     <Route path="/welcome" element={isAuthenticated ? <Welcome /> : <Login onLoginSuccess={handleLoginSuccess} />} />
    //     <Route path="/scheduler" element={isAuthenticated ? (<TeacherScheduler onLogout={handleLogout} />) : (<Login onLoginSuccess={handleLoginSuccess} />)} />
        
    //     {/* Route for LinkLogin page that accepts teacherId in query params */}
    //     <Route path="/LinkLogin" element={<LinkLogin />} />
    //   </Routes>
    // </GoogleOAuthProvider>