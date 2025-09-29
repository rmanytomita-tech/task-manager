import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || '',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">
              アプリケーションエラーが発生しました
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            エラー内容: {this.state.error?.message}
          </Typography>

          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2, textAlign: 'left', maxWidth: '800px', margin: '16px auto' }}>
              <Typography variant="caption" component="pre" sx={{
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.errorInfo}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}