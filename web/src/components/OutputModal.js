import React from 'react';
import { Button, Modal } from 'antd';

const OutputModal = ({ title, isVisible, onClose, output }) => {
  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={700}
    >
      <div 
        style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          maxHeight: '400px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}
      >
        {output || '没有输出'}
      </div>
    </Modal>
  );
};

export default OutputModal;