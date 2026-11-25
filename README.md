# Negara Sistem Bobrok — parallel render

60-second cartoon 3D short rendered with Remotion. The GitHub Actions workflow renders frames 600-1799 in 10 parallel jobs (120 frames each); frames 0-599 were already rendered locally. Artifacts are concatenated and muxed with audio/mix.wav locally.

# Andhika Itera — parallel render

Second video in the same repo. The workflow `render-andhika.yml` renders all 1800 frames of the AndhikaItera composition in 10 parallel jobs (180 frames each, job 0 = 0-179 through job 9 = 1620-1799). No frames are rendered locally for this video. Artifacts are concatenated and muxed with audio/mix.wav locally after download. Frame checks approved before render; VO is generated after the frame checks are approved.
