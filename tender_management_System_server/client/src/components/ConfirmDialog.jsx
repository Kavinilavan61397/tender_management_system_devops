import {
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Button
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = 'primary' }) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            PaperProps={{
                sx: { borderRadius: 3, minWidth: 380, p: 1 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <WarningIcon color="warning" />
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ fontSize: '1rem' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} variant="contained" color={confirmColor} sx={{ borderRadius: 2 }}>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
