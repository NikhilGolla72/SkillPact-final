import { useState, useEffect } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useUpdateUserMutation, useGetUserProfileQuery } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import ErrorScreen from './ErrorScreen';

const ProfileScreen = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resume, setResume] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [branch, setBranch] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  
  // Fetch the complete user profile data
  const { data: profileData, isLoading: profileLoading, error: profileError } = useGetUserProfileQuery();
  const [updateUser, { isLoading, error }] = useUpdateUserMutation();

  useEffect(() => {
    // If we have profile data from the query, use it
    if (profileData) {
      setName(profileData.name || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      setResume(profileData.resume || '');
      setRegistrationNo(profileData.registrationNo || '');
      setBranch(profileData.branch || '');
      setCurrentYear(profileData.currentYear || '');
      setIntroduction(profileData.introduction || '');
    } else {
      // Fallback to userInfo from Redux store
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setPhone(userInfo.phone || '');
      setResume(userInfo.resume || '');
      setRegistrationNo(userInfo.registrationNo || '');
      setBranch(userInfo.branch || '');
      setCurrentYear(userInfo.currentYear || '');
      setIntroduction(userInfo.introduction || '');
    }
  }, [userInfo, profileData]);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted with values:', {
      _id: userInfo._id,
      name,
      email,
      phone,
      password: password ? 'Password provided' : 'No password',
      resume,
      registrationNo,
      branch,
      currentYear,
      introduction
    });
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      console.log('Password mismatch detected');
    } else {
      try {
        console.log('Attempting to update profile in database...');
        
        const res = await updateUser({
          _id: userInfo._id,
          name,
          email,
          phone,
          password,
          resume,
          registrationNo,
          branch,
          currentYear,
          introduction
        }).unwrap();
        
        console.log('API response received:', res);
        console.log('Database update successful');
        
        dispatch(setCredentials(res));
        toast.success('Profile updated successfully');
      } catch (err) {
        console.error('Error updating profile:', err);
        console.log('Error details:', {
          message: err?.data?.message,
          error: err.error,
          status: err?.status
        });
        
        toast.error(err?.data?.message || err.error);
      }
    }
  };
  
  if (profileError || error) {
    return <ErrorScreen />;
  }
  return (
    <FormContainer>
      <h1>Update Profile</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group className='my-2' controlId='name'>
          <Form.Label>Name</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='phone'>
          <Form.Label>Phone Number</Form.Label>
          <InputGroup>
            <InputGroup.Text>+91</InputGroup.Text>
            <Form.Control
              type='tel'
              placeholder='Enter phone number'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="[0-9]{10}"
              isInvalid={phone && !/^\d{10}$/.test(phone)}
            />
            <Form.Control.Feedback type='invalid'>
              Please enter a valid 10-digit phone number.
            </Form.Control.Feedback>
          </InputGroup>
        </Form.Group>

        <Form.Group className='my-2' controlId='registrationNo'>
          <Form.Label>Registration Number</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter registration number'
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='branch'>
          <Form.Label>Branch</Form.Label>
          <Form.Select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
          >
            <option value=''>Select Branch</option>
            <option value='Computer Science'>Computer Science</option>
            <option value='IT'>IT</option>
            <option value='Electrical'>Electrical</option>
            <option value='Mechanical'>Mechanical</option>
            <option value='Civil'>Civil</option>
            <option value='Other'>Other</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className='my-2' controlId='currentYear'>
          <Form.Label>Current Year</Form.Label>
          <Form.Select
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            required
          >
            <option value=''>Select Year</option>
            <option value='1st Year'>1st Year</option>
            <option value='2nd Year'>2nd Year</option>
            <option value='3rd Year'>3rd Year</option>
            <option value='4th Year'>4th Year</option>
            <option value='5th Year'>5th Year</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className='my-2' controlId='email'>
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type='email'
            placeholder='Enter email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='resume'>
          <Form.Label>Resume Link</Form.Label>
          <Form.Control
            type='url'
            placeholder='Enter resume link'
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='introduction'>
          <Form.Label>Briefly introduce yourself and explain why you are interested in applying for this position</Form.Label>
          <Form.Control
            as='textarea'
            rows={3}
            placeholder='Enter introduction'
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Enter password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='confirmPassword'>
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Confirm password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Form.Group>

        <Button type='submit' variant='primary' className='mt-3'>
          Update
        </Button>
        {(isLoading || profileLoading) && <Loader />}
      </Form>
    </FormContainer>
  );
};

export default ProfileScreen;
