import React, { useEffect, useState } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { GenericMatButton } from "@invicara/ipa-core/modules/IpaControls";
import { fetchAllSystems, getAllSystems, saveSystem, setSystemFromSchema } from "../../redux/system-builder";
import _ from "lodash";
import { SystemsTable } from "./SystemsTable";
import { generatePath } from "react-router";
import withRouter from "react-router/es/withRouter";
import { useSystemEditor } from "./useSystemEditor";
import { WithSpinner } from "./SystemSpinner";
import { SystemEditCreatePanel } from "./SystemEditCreatePanel";
import { Overlay } from "@invicara/ipa-core/modules/IpaControls";


const SystemBuilderLanding = ({ handler, saveSystem, allSystems, history, onLoadComplete, fetchAllSystems, setSystemFromSchema, detailPage }) => {

    useEffect(() => {
        onLoadComplete();
        setSystemFromSchema(handler.config.getSystemFromSchemaScript)
        fetchAllSystems(handler.config.getAllSystemsScript)
    }, []);

    const getSystem = async (systemId) => history.push(generatePath(detailPage.path,{systemId: systemId}));

    const handleCreate = async (systemName, systemDescription, systemCategoryType, systemStatus, systemColor) => {
        const newSystem = await saveSystem(handler.config.createSystemScript, systemName, systemDescription, systemCategoryType, systemStatus, systemColor)
        if (!_.isEmpty(newSystem._id)) {
            getSystem(newSystem._id)
        } else if (!newSystem.success) {
            setOverlayMessage(newSystem.message, 2000)
        }
    }

    const [overlay, setOverlay] = useState({ show: false });

    const setOverlayMessage = (content, duration) => setOverlay({
        show: true,
        duration,
        onFadeOut: () => setOverlay({ show: false }),
        content
    })

    const {
        systemName, setSystemName, systemDescription, setSystemDescription, systemCategoryType, setSystemCategoryType, systemStatus, setSystemStatus,
        systemInfoMessage, trySaveSystem, systemColor, setSystemColor
    } = useSystemEditor(handleCreate)


    const canCreate = () => !_.isEmpty(systemName) && !_.isEmpty(_.get(systemCategoryType, 'System Category')) &&
        !_.isEmpty(_.get(systemCategoryType, 'System Type')) && !_.isEmpty(systemStatus) && !_.isEmpty(systemColor);;

    return <div className='systems-landing'>
        <div className='landing-system-info'>
            <div className='landing-header'>Create a New System</div>
            <Overlay config={overlay} />
            <SystemEditCreatePanel systemName={systemName}
                setSystemName={setSystemName}
                systemDescription={systemDescription}
                setSystemDescription={setSystemDescription}
                systemCategoryType={systemCategoryType}
                setSystemCategoryType={setSystemCategoryType}
                systemStatus={systemStatus}
                setSystemStatus={setSystemStatus}
                systemColor={systemColor}
                setSystemColor={setSystemColor}
                picklistSelectsConfig={handler.config.picklistSelectsConfig}
                systemStatusConfig={handler.config.systemStatus} />
            <div style={{
                width: '90%',
                display: 'inline-flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
                alignItems: 'center'
            }}>
                {systemInfoMessage.message && <div className={clsx(systemInfoMessage.error && 'system-update-error')}>
                    {systemInfoMessage.message}
                </div>}
                <GenericMatButton onClick={trySaveSystem} customClasses="pink-button" disabled={!canCreate()}>
                    Create
                </GenericMatButton>
            </div>
        </div>
        <div className="vertical-divider">
            <div className='divider' />
            <div className="center-element">Or</div>
            <div className='divider' />
        </div>
        <div className='systems-table'>
            <div className='landing-header'>Select a System</div>
            <WithSpinner loading={!allSystems}>{_.isEmpty(allSystems) ?
                <div className='no-systems'>No systems</div> :
                <SystemsTable onClick={(systemId) => getSystem(systemId)} systems={allSystems} />
            }</WithSpinner>
        </div>
    </div>
}

const mapStateToProps = state => ({
    allSystems: getAllSystems(state)
});


const mapDispatchToProps = {
    saveSystem, fetchAllSystems, setSystemFromSchema
}

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withRouter
)(SystemBuilderLanding)