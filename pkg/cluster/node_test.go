package cluster

import (
	model "github.com/stefandanzl/cloudr/models"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestNewNodeFromDBModel(t *testing.T) {
	a := assert.New(t)
	a.IsType(&SlaveNode{}, NewNodeFromDBModel(&model.Node{
		Type: model.SlaveNodeType,
	}))
	a.IsType(&MasterNode{}, NewNodeFromDBModel(&model.Node{
		Type: model.MasterNodeType,
	}))
}
