# Token Optimization & Free Tier Management

This document outlines how the NoSQL Security Monitor manages Google Gemini API usage to stay within free tier limits.

## Free Tier Limits (Gemini 2.5 Flash)

| Metric | Limit | Conservative Setting |
|--------|-------|---------------------|
| Requests per Minute | 15 | 10 |
| Tokens per Minute | 1,000,000 | No limit needed |
| Requests per Day | 1,500 | 1,400 |

## Token Optimization Strategies

### 1. Input Token Reduction
- **Optimized Prompts**: Reduced from ~800 tokens to ~300-400 tokens
- **Essential Data Only**: Extract only critical attack information
- **Structured Format**: Use bullet points and concise language
- **Remove Redundancy**: Eliminate unnecessary explanatory text

### 2. Output Token Control
- **maxOutputTokens**: Set to 1,000 tokens (ensures ~2 page reports)
- **Temperature**: 0.3 (focused, less verbose responses)
- **Structured Sections**: Predefined format reduces token waste

### 3. Rate Limiting Implementation
```javascript
// Conservative rate limiting
MIN_REQUEST_INTERVAL = 6000ms  // 6 seconds = 10 requests/minute
MAX_DAILY_REQUESTS = 1400      // Buffer of 100 requests
```

## Usage Monitoring

### Persistent Tracking
- **Daily Usage**: Stored in `logs/gemini-usage.json`
- **Token Counting**: Both input and output tokens tracked
- **Historical Data**: Last 30 days of usage retained
- **Cross-Session**: Survives application restarts

### Real-Time Monitoring
```bash
npm run usage  # Check current usage status
```

### Automatic Fallback
- **Quota Exceeded**: Automatically falls back to basic PDF generation
- **Rate Limited**: Implements automatic delays between requests
- **Error Handling**: Graceful degradation when API limits reached

## Token Usage Estimates

### Typical Attack Report
- **Input**: ~350 tokens (optimized prompt + attack data)
- **Output**: ~600 tokens (2-page professional report)
- **Total**: ~950 tokens per report

### Daily Capacity
- **Conservative Limit**: 1,400 requests/day
- **Token Budget**: ~1,330,000 tokens/day (950 × 1,400)
- **Well Under Limit**: Daily token limit is 1,000,000/minute = 1.44B/day

## Best Practices

### 1. Monitor Usage
```bash
# Check usage regularly
npm run usage

# Watch for warnings
grep "WARNING\|ERROR" logs/*.log
```

### 2. Handle High Attack Volumes
- System automatically throttles requests during attack bursts
- Rate limiting prevents quota exhaustion
- Critical attacks still generate reports with delays

### 3. Optimize for Production
- Monitor daily usage patterns
- Adjust rate limits based on actual attack frequency
- Consider upgrading to paid tier if consistently hitting limits

## Usage Scenarios

### Low Attack Environment (< 100 attacks/day)
- **Impact**: Minimal - well within all limits
- **Recommendation**: Current settings optimal

### Medium Attack Environment (100-500 attacks/day)
- **Impact**: Moderate - rate limiting may delay some reports
- **Recommendation**: Monitor usage, consider attack prioritization

### High Attack Environment (> 500 attacks/day)
- **Impact**: Significant - daily limits may be reached
- **Recommendation**: Implement attack filtering or upgrade to paid tier

## Troubleshooting

### "Daily request limit reached"
- Check usage: `npm run usage`
- Wait until midnight UTC for reset
- Consider implementing attack prioritization

### "Rate limiting: waiting Xms"
- Normal behavior during attack bursts
- Reports will be generated with delays
- Consider reducing attack sensitivity if too frequent

### Fallback to Basic Reports
- API key missing or invalid
- Quota exceeded
- Network connectivity issues
- Basic reports still provide attack details

## Migration to Paid Tier

If your usage consistently exceeds free tier limits:

1. **Upgrade Benefits**:
   - 1,000 requests per minute (vs 15)
   - 2,000,000 tokens per minute (vs 1,000,000)
   - No daily request limits

2. **Cost Considerations**:
   - Pay-per-use pricing
   - ~$0.075 per 1K input tokens
   - ~$0.30 per 1K output tokens

3. **Configuration Changes**:
   - Increase `MAX_REQUESTS_PER_MINUTE` to 100+
   - Remove `MAX_DAILY_REQUESTS` limit
   - Reduce `MIN_REQUEST_INTERVAL` to 1000ms
