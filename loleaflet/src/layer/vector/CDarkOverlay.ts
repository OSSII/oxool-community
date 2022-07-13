/*
 * CDarkOverlay is used to render a dark overlay around an OLE object when selected
 */

import Bounds = oxool.Bounds;

class CDarkOverlay extends CPathGroup {

	private rectangles: CRectangle[] = [];
	private options: any;

	constructor(pointSet: CPointSet, options: any) {
		super([]);
		this.options = options;
		this.rectangles = this.createRectangles(4);
		this.setPointSet(pointSet);
	}

	private setPointSet(pointSet: CPointSet) {
		var points = pointSet.getPointArray();
		if (!points) {
			for (var i = 0; i < this.rectangles.length; i++) {
				this.rectangles[i].setBounds(
					new oxool.Bounds(new oxool.Point(0, 0), new oxool.Point(0, 1)));
				this.push(this.rectangles[i]);
			}
			return;
		}

		var rectangleBounds = this.invertOleBounds(new oxool.Bounds(points[0], points[2]));

		for (var i = 0; i < this.rectangles.length; i++) {
			this.rectangles[i].setBounds(rectangleBounds[i]);
			this.push(this.rectangles[i]);
		}
	}

	private invertOleBounds(oleBounds: oxool.Bounds): oxool.Bounds[] {
		var rectanglesBounds: oxool.Bounds[] = [];

		var minWidth = 0;
		var minHeight = 0;
		var fullWidth = 1000000;
		var fullHeight = 1000000;

		rectanglesBounds.push(new oxool.Bounds(new oxool.Point(minWidth, minHeight), new oxool.Point(fullWidth, oleBounds.min.y)));
		rectanglesBounds.push(new oxool.Bounds(new oxool.Point(minWidth, oleBounds.min.y), oleBounds.getBottomLeft()));
		rectanglesBounds.push(new oxool.Bounds(oleBounds.getTopRight(), new oxool.Point(fullWidth, oleBounds.max.y)));
		rectanglesBounds.push(new oxool.Bounds(new oxool.Point(minWidth, oleBounds.max.y), new oxool.Point(fullWidth, fullHeight)));

		return rectanglesBounds;
	}

	private createRectangles(quantity: number): CRectangle[] {
		var rectangles: CRectangle[] = [];
		for (var i = 0; i < quantity; i++) {
			rectangles.push(
				new CRectangle(new oxool.Bounds(
					new oxool.Point(0, 0), new oxool.Point(0, 1)
				), this.options));
		}

		return rectangles;
	}
}
