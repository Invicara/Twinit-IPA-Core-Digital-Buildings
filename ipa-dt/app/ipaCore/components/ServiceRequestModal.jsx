import React, {useMemo, useState} from "react";
import {GenericModal} from "@invicara/ipa-core/modules/IpaDialogs";
import {GenericMatButton, SimpleTable} from "@invicara/ipa-core/modules/IpaControls";
import Select from 'react-select';
import {connect} from "react-redux";
import {User} from "@invicara/ipa-core/modules/IpaRedux";

const RawServiceRequestModal = ({entity, action, close, user}) => {
    const entities = useMemo(() => entity ? Array.isArray(entity) ? entity : [entity] : undefined, [entity]);
    const [defaultPriorities] = useState(['Standard', 'High', 'Urgent']);
    const priorities = action.component.priorities || defaultPriorities;
    const options = useMemo(()=>priorities.map(s =>  ({label: s, value: s})),[priorities]);
    
    return <GenericModal
        title={'Service Request'}
        customClasses={'service-request-modal'}
        noPadding noBackground
        modalBody={<div className={'service-request-modal-body'}>
            <div className={'panel'}>
                <div className={'sub-header-items'}>
                <span className={'sub-header-item'}>Request Date: <span className={'sub-header-data'}>{new Date().toLocaleDateString()}</span></span>
                <span className={'sub-header-item'}>Requested By: <span className={'sub-header-data'}>{user ? user._firstname + ' ' + user._lastname : ''}</span></span>
                <span className="sub-header-item priority-item">
                    <span>Priority:</span> 
                    <Select
                    isMulti={false}                    
                    options={options}
                    className="priority-select sub-header-data"
                    closeMenuOnSelect={true}
                    placeholder={'Select a Priority'}
                /> </span>                
                </div>
                {entities && entities.map((e) => <div key={[e["Entity Name"]]}><div className={'asset-name'}>{[e["Entity Name"]]}</div><SimpleTable className={"fixed-header simple-property-grid"} rows={Object.entries(e.properties).filter(p => action.component.properties.includes(p[1].dName) && p[1].val).map(([key, f]) => [key, f.val])}/></div>)} 
                <textarea className={'service-request-textarea'} placeholder="Describe your service request"></textarea>
            </div>
            <div className={'buttons'}>
                <GenericMatButton customClasses="cancel-button"
                                  onClick={close}>Cancel</GenericMatButton>
                <GenericMatButton customClasses="main-button"
                    onClick={close}>Submit</GenericMatButton>
            </div>
        </div>} />
}

export const ServiceRequestModalFactory = {
    create: ({type, action, entity, context}) => {
        let modal = <ServiceRequestModal action={action} entity={entity} type={type} close={() => context.ifefShowModal(false)} />
        context.ifefShowModal(modal);
        return modal
    }
}

const mapStateToProps = state => ({
    user: User.getUser(state),
});

export const ServiceRequestModal = connect(mapStateToProps)(RawServiceRequestModal);
