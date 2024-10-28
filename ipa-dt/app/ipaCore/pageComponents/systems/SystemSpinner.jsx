import React from "react";

export const SystemSpinner = () => <div className='content-loading'>
    <div className='spinner'>Loading system...<i className="fas fa-spinner fa-spin"/></div>
</div>;

export const WithSpinner = ({loading, children}) => {
    return loading ?
        <div className='spinner'><i className="fas fa-spinner fa-spin"/></div> :
        <>{children}</>
}