import React from "react";
import "./Rigister.css";

function Rigister() {
  return (
    <div>
        <div className="i-container">
          
          
            <div className="i-form">
              <div className="i-header">Create an account</div>
              <label htmlFor="username">Username</label><br />
              <input type="text" id="username" name="username" required />
                <br />
              <label htmlFor="Password">Password</label><br />
              <input type="Password" id="Password" name="Password" required />
                <br />
             <div className="i-create"> <button>
                Create account
              </button>
              </div>
              <div className="i-google">
                <button>
                  <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="google logo" width={10} content="" />
                  Sign up with Google
                </button>
                <br />

               <label htmlFor="log in">
                Already have an account?{" "}
                <a href="/login" className="i-Login">Log in</a>
                  </label>
              <div>
                ee
              </div>
              </div>
          </div>
          </div>
    </div>
  );
}

export default Rigister;
