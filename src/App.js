
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


const MyControlComponent = ({ onDateChange, selectedDate }) => {
  const map = useMap();
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(true);
  console.log("newDate", date);
  const maxDate = new Date();
  maxDate.setHours(0, 0, 0, 0);
  
  const controlStyle = {
    position: 'absolute',
    top: '10px',
    right: '80px',
    backgroundColor: 'white',
    padding: '5px 10px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    zIndex: 1000,
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    onDateChange(newDate); 
    console.log('Selected date:', newDate);
  };
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };
  return (
    <div style={controlStyle}>
      {!showCalendar ? (
        <div >
          <button onClick={toggleCalendar} style={{ backgroundColor: '#f0ad4e', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
            Open Calendar
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom:20 }}>
            <h2 style={{ marginRight: '170px', marginBottom: '0' }}>Calendar</h2>
            <button onClick={toggleCalendar}>Close Calendar</button>
          </div>

          {/* //<p>This is a custom control component</p> */}
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            onClickDay={(value, event) => event.stopPropagation()}
            maxDate={new Date()}
          />
        </div>
      )}
    </div>
  );
};

// Fix the default icon issue with leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
  const [markers, setMarkers] = useState([]);
  const markerRefs = useRef([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [center, setCenter] = useState([0,0]);
  const [loading, setLoading]= useState(false);
  console.log(loading);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://backendforpnf.vercel.app/getgps');
        const data = response.data.data;
        const lastFiveRecords = data.slice(-5);
        console.log(lastFiveRecords)
        
        // Filter data based on selected date
        const filteredData = data.filter(item => {
          const itemDate = new Date(item.timestamp);
          // Normalize itemDate to midnight for comparison
          itemDate.setHours(0, 0, 0, 0);
          // Normalize selectedDate to midnight for comparison
          const normalizedSelectedDate = new Date(selectedDate);
          normalizedSelectedDate.setHours(0, 0, 0, 0);

          return itemDate.getTime() === normalizedSelectedDate.getTime();
        });

        if (filteredData.length > 0) {
          const latAvg = filteredData.reduce((prev, curr) => prev + parseFloat(curr.latitude), 0) / filteredData.length;
          const lonAvg = filteredData.reduce((prev, curr) => prev + parseFloat(curr.longitude), 0) / filteredData.length;
          setCenter([latAvg, lonAvg]);
          
          setMarkers(filteredData);
        } else {
          setCenter([0,0]); // Reset center
          setMarkers([]); // Clear markers
          
        }
        setMarkers(filteredData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally{
        setLoading(false)
      }
    };

    fetchData();
  }, [selectedDate]); // Fetch data whenever selectedDate changes

  const handleMouseOver = (index) => {
    markerRefs.current[index]?.openPopup();
  };

  const handleMouseOut = (index) => {
    markerRefs.current[index]?.closePopup();
  };

  const getUsernameColor = (username) => {
    switch (username.toLowerCase()) {
      case 'riktam test2':
        return 'blue';
      case 'ramchandra rotte':
        return 'red';
      case 'maula shaikh':
        return 'green';
      case 'abdul shaikh':
        return 'purple';
      case 'test test':
        return 'orange';
      case 'pratibha finance':
        return 'orange';
      case 'sohail shaikh':
        return 'yellow';
      case 'shingshetty shingshetty':
        return 'black';
      default:
        return 'gray'; // Default color for unknown usernames
    }
  };

  const getMarkerIcon = (username) => {
    const color = getUsernameColor(username);
    const iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`;
    const defaultIconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const markerIcon = new L.Icon({
      iconUrl: iconUrl.length > 0 ? iconUrl : defaultIconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    return markerIcon;
  };

  return (
    <div>
      <MapContainer key={center[0]} center={center? center: center[0,0]} zoom={7} style={{ height: '800px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MyControlComponent onDateChange={setSelectedDate} selectedDate={selectedDate}/> 
        {loading ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            Loading...
          </div>
        ) : markers.length > 0 ? (
          markers.map((marker, index) => (
            <Marker
              key={index}
              position={[parseFloat(marker.latitude), parseFloat(marker.longitude)]}
              ref={(el) => (markerRefs.current[index] = el)}
              eventHandlers={{
                mouseover: () => handleMouseOver(index),
                mouseout: () => handleMouseOut(index),
              }}
              riseOnHover={true}
              icon={getMarkerIcon(marker['user name'])}
            >
              <Popup>
                <div>
                  <h3>User: {marker['user name']}</h3>
                  <p>Latitude: {marker.latitude}</p>
                  <p>Longitude: {marker.longitude}</p>
                  <p>Time: {marker.timestamp}</p>
                </div>
              </Popup>
            </Marker>
          ))
        ) : (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            No location data available for selected date.
          </div>
        )}
      </MapContainer>
    </div>
  );
}

export default App;
