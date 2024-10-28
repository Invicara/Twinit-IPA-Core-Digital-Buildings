import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import './TaskCard.scss'
import icon from '../../../../public/icons/grab.svg'


const TaskCard = ({ item, index }) => {
  return (
    <Draggable key={item} draggableId={item} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className='TaskInformation'>
            <img src={icon} /><span>{item}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
