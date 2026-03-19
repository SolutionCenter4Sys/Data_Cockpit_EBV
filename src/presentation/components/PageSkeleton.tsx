import { Box, Skeleton, Grid, useTheme } from '@mui/material';

interface PageSkeletonProps {
  rows?: number;
  cards?: number;
}

export default function PageSkeleton({ rows = 4, cards = 4 }: PageSkeletonProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const skeletonBgCard = isLight ? 'rgba(0,47,108,0.05)' : 'rgba(255,255,255,0.05)';
  const skeletonBgRow = isLight ? 'rgba(0,47,108,0.04)' : 'rgba(255,255,255,0.04)';

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton
              variant="rounded"
              height={110}
              sx={{ bgcolor: skeletonBgCard, borderRadius: 2 }}
            />
          </Grid>
        ))}
      </Grid>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={48}
          sx={{ mb: 1, bgcolor: skeletonBgRow, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}
