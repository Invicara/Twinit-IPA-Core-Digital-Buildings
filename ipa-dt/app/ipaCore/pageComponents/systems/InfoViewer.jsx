import {makeStyles} from "@material-ui/styles";
import React from "react";
import clsx from "clsx";
import Popover from "@material-ui/core/Popover/Popover";
import _ from "lodash";

const useStyles = makeStyles(() => ({
    popover: {
    },
    paper: {
        padding: 15,
    },
}));

export const InfoViewer = ({iconClass = "fas fa-info", entity}) => {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handlePopoverOpen = (event) => {
        if(!anchorEl) setAnchorEl(event.currentTarget);
        else setAnchorEl(null)
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return <div className="info-overlay-container">
        <i className={clsx(iconClass, 'info-icon')} onClick={handlePopoverOpen}/>
        <Popover
            id="mouse-over-popover"
            className={classes.popover}
            classes={{
                paper: classes.paper,
            }}
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            onClose={handlePopoverClose}
            disableRestoreFocus
        >
            {!_.isEmpty(entity) && _.values(entity.properties).map(({val, dName}) =>
                <div className="info-property"><div className="info-property-name">{`${dName}: `}</div>{val || ' - '}</div>
            )}
        </Popover>
    </div>
}