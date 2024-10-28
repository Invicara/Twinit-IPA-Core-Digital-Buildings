import React from "react";
import { Toolbar, Typography } from "@material-ui/core";

const EntityTableToolbar = ({numSelected}) => {
    return (
        <React.Fragment>
        <Toolbar disableGutters={true} variant="dense">
            {numSelected > 0 ? (
                <Typography variant="overline" display="block" gutterBottom
                >{`Showing ${numSelected} ${numSelected > 1 ? 'collections' : 'collection'}`}
                </Typography>
            ) : 'No collections found'}
        </Toolbar>
        </React.Fragment>
    );
};
export default EntityTableToolbar