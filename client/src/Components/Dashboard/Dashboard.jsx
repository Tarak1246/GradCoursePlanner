import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'

const Dashboard = () => {


    const navigate = useNavigate();
    const goToCourse = () => {
          navigate('/courses'); 
      };

      const goToRegister = () => {
          navigate('/register-classes');
      };
      

  return (
    <div className='container'>
    <div className='dashboardcontainer'>
      <div className='dashheader'>
        <p>Welcome to Wright State University Course Planner</p>
      </div>
      <div className='dashbuttons'>
        <button className='button' onClick={goToCourse()}>View Courses</button>
        <button className='button' onClick={goToRegister()}>Register Classes</button>
      </div>
    </div>
    
    </div>
    
    
  );
};

export default Dashboard;

