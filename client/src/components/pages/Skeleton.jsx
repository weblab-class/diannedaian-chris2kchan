import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./Skeleton.css";

import { UserContext } from "../App";

const Skeleton = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  const [dreams, setDreams] = useState([]);

  useEffect(() => {
    if (userId) {
      fetch(`/api/dreams/user/${userId}`)
        .then((res) => res.json())
        .then((data) => setDreams(data))
        .catch((err) => console.error("Error fetching dreams:", err));
    }
  }, [userId]);

  return (
    <div>
      {userId ? (
        <>
          <button
            onClick={() => {
              googleLogout();
              handleLogout();
            }}
          >
            Logout
          </button>
          <DreamTree dreams={dreams} />
        </>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      )}
    </div>
  );
};

export default Skeleton;
