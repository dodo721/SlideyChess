import React, { useEffect, useState } from 'react';
import { Alert } from 'reactstrap';

const ErrorAlert = ({error, clearError}) => {

    const [showing, setShowing] = useState(false);

    useEffect(() => {
        if (error) {
            console.error("[ERROR]", error);
            setShowing(true);
            setTimeout(() => clearError(), 5000);
        }
    }, [error]);

    return error && showing ? <Alert color="danger">{error}</Alert> : null;

};

export default ErrorAlert;
