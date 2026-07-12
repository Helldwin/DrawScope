import GridCheckerCard from "../GridCheckerCard"
import MultiGridsCard from "../MultiGridsCard"
import RuleBuilderCard from "../RuleBuilderCard"
import type { NumberKind } from "../../lib/stats"
import type { Draw } from "../../types"

export default function RulesTab({
	draws,
	scores,
	onSelect
}: {
	draws: Draw[]
	scores: Record<number, number>
	onSelect: (n: number, kind: NumberKind) => void
}) {
	const selectMain = (n: number) => onSelect(n, "main")

	return (
		<>
			<RuleBuilderCard scores={scores} onSelect={selectMain} />
			<MultiGridsCard draws={draws} compositeScores={scores} onSelect={selectMain} />
			<GridCheckerCard draws={draws} scores={scores} />
		</>
	)
}
