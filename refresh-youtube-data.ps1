param(
  [string]$ApiKey = $env:YOUTUBE_API_KEY
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  throw 'Set YOUTUBE_API_KEY or pass -ApiKey. The key is never written to the site.'
}

$channelId = 'UCHPes4lqVxxQ0KG8mNfGcAw'
$uploadsPlaylist = 'UUHPes4lqVxxQ0KG8mNfGcAw'
$outputPath = Join-Path $PSScriptRoot 'channel-data.json'

function Get-IsoDurationSeconds([string]$duration) {
  $match = [regex]::Match($duration, '^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$')
  if (-not $match.Success) { return 0 }
  return ([int]$match.Groups[1].Value * 3600) + ([int]$match.Groups[2].Value * 60) + [int]$match.Groups[3].Value
}

$existing = Get-Content -Raw -LiteralPath $outputPath | ConvertFrom-Json
$channelUri = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=' + $channelId + '&key=' + $ApiKey
$playlistUri = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=' + $uploadsPlaylist + '&maxResults=30&key=' + $ApiKey

$channel = (Invoke-RestMethod -Uri $channelUri).items[0]
$playlistItems = (Invoke-RestMethod -Uri $playlistUri).items
$videoIds = ($playlistItems | ForEach-Object { $_.contentDetails.videoId }) -join ','
$videosUri = 'https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=' + $videoIds + '&key=' + $ApiKey
$videoItems = (Invoke-RestMethod -Uri $videosUri).items
$videoById = @{}
foreach ($video in $videoItems) { $videoById[$video.id] = $video }

$recentVideos = @()
foreach ($entry in $playlistItems) {
  $video = $videoById[$entry.contentDetails.videoId]
  if ($null -eq $video) { continue }
  $seconds = Get-IsoDurationSeconds $video.contentDetails.duration
  if ($seconds -lt 180 -or $seconds -gt 1800) { continue }
  $recentVideos += [ordered]@{
    id = $video.id
    title = $entry.snippet.title
    publishedAt = $entry.contentDetails.videoPublishedAt
    views = [int64]$video.statistics.viewCount
    likes = [int64]$video.statistics.likeCount
    comments = [int64]$video.statistics.commentCount
    duration = $video.contentDetails.duration
  }
  if ($recentVideos.Count -ge 6) { break }
}

$campaignId = $existing.brandProof.featuredCampaign.videoId
$campaignVideo = $videoById[$campaignId]
$featuredCampaign = $existing.brandProof.featuredCampaign
if ($null -ne $campaignVideo) {
  $featuredCampaign.views = [int64]$campaignVideo.statistics.viewCount
  $featuredCampaign.likes = [int64]$campaignVideo.statistics.likeCount
  $featuredCampaign.comments = [int64]$campaignVideo.statistics.commentCount
}

$payload = [ordered]@{
  schemaVersion = 1
  source = 'YouTube Data API v3'
  channelId = $channelId
  handle = '@toogoodtech'
  fetchedAt = (Get-Date).ToUniversalTime().ToString('o')
  public = [ordered]@{
    title = $channel.snippet.title
    subscriberCount = [int64]$channel.statistics.subscriberCount
    viewCount = [int64]$channel.statistics.viewCount
    videoCount = [int64]$channel.statistics.videoCount
  }
  creatorAnalytics = $existing.creatorAnalytics
  brandProof = [ordered]@{
    paidPartnerships = [int]$existing.brandProof.paidPartnerships
    paidPartnerNames = @($existing.brandProof.paidPartnerNames)
    productCollaborations = [int]$existing.brandProof.productCollaborations
    productCollaborationNames = @($existing.brandProof.productCollaborationNames)
    featuredCampaign = $featuredCampaign
  }
  recentVideos = $recentVideos
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPath, ($payload | ConvertTo-Json -Depth 10), $utf8NoBom)
Write-Host ('Updated channel-data.json from the official YouTube API at ' + $payload.fetchedAt)
