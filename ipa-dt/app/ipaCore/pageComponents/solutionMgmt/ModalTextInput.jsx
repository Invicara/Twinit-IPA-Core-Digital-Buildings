import React from 'react'

const ModalTextInput = ({title, placeholder, type = ''}) => {
return (
    <div>
        <p>{title}</p>
        {type === 'textarea' ? <textarea style={{width:'100%', height:'80px',  border: '1px solid lightgrey', borderRadius:'5px', padding: '2px 8px', marginBottom: '28px'}} placeholder={placeholder}></textarea>:
        <input placeholder={placeholder} style={{width:'100%', height:'32px',  border: '1px solid lightgrey', borderRadius:'5px', padding: '2px 8px', marginBottom: '28px'}}/>}
        <div>
        </div>
    </div>
)
}

export default ModalTextInput