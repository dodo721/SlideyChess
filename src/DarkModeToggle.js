import React from 'react';

const DarkModeToggle = ({on, style, onChange, ...props}) => {
    const img = on ? "/images/moon_on.png" : "/images/moon_off.png";
    let defStyle = {cursor:"pointer"};
    defStyle = Object.assign(defStyle, style);
    return <img src={img} {...props} alt="Dark mode toggle" onClick={() => onChange(!on)} style={defStyle} />
}

export default DarkModeToggle;
