import { SkeletonBar } from "./Skeleton"

export default function Loader() {
	return (
		<div className="page" aria-busy="true" aria-label="Chargement de DrawScope">
			<header className="page-header">
				<div>
					<SkeletonBar width={180} height={28} radius={8} />
					<div style={{ marginTop: 8 }}>
						<SkeletonBar width={260} height={14} />
					</div>
				</div>
				<SkeletonBar width={150} height={32} radius={999} />
			</header>

			<div className="tab-nav" style={{ position: "static" }}>
				{Array.from({ length: 5 }, (_, i) => (
					<SkeletonBar key={i} width={90} height={34} radius={999} />
				))}
			</div>

			<div className="page-main">
				<div className="card">
					<SkeletonBar width="35%" height={18} />
					<div style={{ marginTop: 16 }}>
						<SkeletonBar height={54} />
					</div>
				</div>
				<div className="card">
					<SkeletonBar width="45%" height={18} />
					<div style={{ marginTop: 16, display: "flex", gap: 10 }}>
						{Array.from({ length: 5 }, (_, i) => (
							<SkeletonBar key={i} width={56} height={56} radius={999} />
						))}
					</div>
				</div>
				<div className="card">
					<SkeletonBar width="30%" height={18} />
					<div style={{ marginTop: 16 }}>
						<SkeletonBar height={140} />
					</div>
				</div>
			</div>
		</div>
	)
}
